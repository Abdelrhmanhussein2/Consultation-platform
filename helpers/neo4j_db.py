from neo4j import GraphDatabase, Driver
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
        "CREATE CONSTRAINT judgment_id_unique IF NOT EXISTS FOR (j:Judgment) REQUIRE j.ruling_id IS UNIQUE"
    ]
    
    session = neo4j_db.get_session()
    try:
        for query in constraints:
            session.run(query)
        print("Neo4j constraints initialized successfully.")
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

