import psycopg2  # Ensure real psycopg2 driver is present in sys.modules
import neo4j     # Ensure real neo4j driver is present in sys.modules so it is not replaced by MagicMock
