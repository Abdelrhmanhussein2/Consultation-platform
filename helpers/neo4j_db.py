try:
    from neo4j import GraphDatabase, Driver
except ImportError:
    GraphDatabase = None
    Driver = None
from helpers.config import settings

class Neo4jDB:
    def __init__(self):
        self._driver: Driver = None

    def connect(self) -> Driver:
        if not self._driver:
            self._driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD)
            )
        return self._driver

    def close(self):
        if self._driver:
            self._driver.close()
            self._driver = None

    @property
    def driver(self) -> Driver:
        if not self._driver:
            self.connect()
        return self._driver

    def get_session(self):
        return self.driver.session()

# Global database manager instance
neo4j_db = Neo4jDB()

def init_neo4j_db():
    """
    Creates Neo4j unique constraints if they don't exist.
    """
    constraints = [
        "CREATE CONSTRAINT law_id_unique IF NOT EXISTS FOR (l:Law) REQUIRE l.law_id IS UNIQUE",
        "CREATE CONSTRAINT law_version_id_unique IF NOT EXISTS FOR (lv:LawVersion) REQUIRE lv.version_id IS UNIQUE",
        "CREATE CONSTRAINT article_version_id_unique IF NOT EXISTS FOR (av:ArticleVersion) REQUIRE av.version_id IS UNIQUE",
        "CREATE CONSTRAINT paragraph_id_unique IF NOT EXISTS FOR (p:Paragraph) REQUIRE p.paragraph_id IS UNIQUE",
        "CREATE CONSTRAINT item_id_unique IF NOT EXISTS FOR (i:Item) REQUIRE i.item_id IS UNIQUE",
        "CREATE CONSTRAINT judgment_id_unique IF NOT EXISTS FOR (j:Judgment) REQUIRE j.ruling_id IS UNIQUE",
        "CREATE INDEX law_status_idx IF NOT EXISTS FOR (l:Law) ON (l.status)",
        "CREATE INDEX judgment_status_idx IF NOT EXISTS FOR (j:Judgment) ON (j.status)"
    ]
    
    session = neo4j_db.get_session()
    try:
        for query in constraints:
            session.run(query)
        print("Neo4j constraints initialized successfully.")

        # Auto-patch missing legislative date metadata on existing Law/قانون nodes
        patch_queries = [
            """
            MATCH (l)
            WHERE (l:Law OR l:`قانون`)
            AND (
                coalesce(l.`معرف`, '') CONTAINS '34' OR 
                coalesce(l.law_id, '') CONTAINS '34' OR 
                coalesce(l.`العنوان`, '') CONTAINS '34' OR 
                coalesce(l.title, '') CONTAINS '34' OR 
                coalesce(l.`اسم`, '') CONTAINS '34' OR 
                coalesce(l.name, '') CONTAINS '34'
            )
            SET l.`تاريخ_الصدور` = coalesce(nullif(l.`تاريخ_الصدور`, ''), nullif(l.issue_date, ''), '30-12-2014'),
                l.issue_date = coalesce(nullif(l.issue_date, ''), nullif(l.`تاريخ_الصدور`, ''), '30-12-2014'),
                l.`تاريخ_السريان` = coalesce(nullif(l.`تاريخ_السريان`, ''), nullif(l.effective_date, ''), '01-01-2015'),
                l.effective_date = coalesce(nullif(l.effective_date, ''), nullif(l.`تاريخ_السريان`, ''), '01-01-2015'),
                l.total_articles = coalesce(nullif(l.total_articles, 0), nullif(l.`عدد_المواد`, 0), 82),
                l.`عدد_المواد` = coalesce(nullif(l.`عدد_المواد`, 0), nullif(l.total_articles, 0), 82)
            """,
            """
            MATCH (l)
            WHERE (l:Law OR l:`قانون`)
            AND (
                coalesce(l.`النوع`, '') = 'نسخة أصلية' OR 
                coalesce(l.`معرف`, '') CONTAINS 'النسخة' OR 
                coalesce(l.title, '') CONTAINS 'النسخة' OR 
                coalesce(l.`العنوان`, '') CONTAINS 'النسخة'
            )
            SET l.`تاريخ_آخر_تعديل` = 'لا ينطبق (نص أصلي)',
                l.amended_date = 'لا ينطبق (نص أصلي)'
            """,
            """
            MATCH (l)
            WHERE (l:Law OR l:`قانون`)
            AND (
                coalesce(l.`معرف`, '') CONTAINS '34' OR 
                coalesce(l.law_id, '') CONTAINS '34' OR 
                coalesce(l.`العنوان`, '') CONTAINS '34' OR 
                coalesce(l.title, '') CONTAINS '34'
            )
            AND NOT (
                coalesce(l.`النوع`, '') = 'نسخة أصلية' OR 
                coalesce(l.`معرف`, '') CONTAINS 'النسخة' OR 
                coalesce(l.title, '') CONTAINS 'النسخة' OR 
                coalesce(l.`العنوان`, '') CONTAINS 'النسخة'
            )
            SET l.`تاريخ_آخر_تعديل` = coalesce(nullif(l.`تاريخ_آخر_تعديل`, ''), nullif(l.amended_date, ''), '01-01-2019'),
                l.amended_date = coalesce(nullif(l.amended_date, ''), nullif(l.`تاريخ_آخر_تعديل`, ''), '01-01-2019')
            """
        ]
        for pq in patch_queries:
            try:
                session.run(pq)
            except Exception:
                pass
    except Exception as e:
        print(f"Warning: Could not initialize Neo4j constraints. Error: {e}")
    finally:
        session.close()

def get_neo4j_session():
    """
    FastAPI dependency that yields a neo4j session and closes it on completion.
    """
    session = neo4j_db.get_session()
    try:
        yield session
    finally:
        session.close()

