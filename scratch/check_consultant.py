from helpers.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    res = conn.execute(text("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'consultant_profiles'
        ORDER BY ordinal_position;
    """)).fetchall()
    print("DB columns in consultant_profiles:")
    for r in res:
        print(f" - {r[0]} ({r[1]})")

    # Also test query for consultant profile
    try:
        from models.consultant_profile import ConsultantProfile
        from models.user import User
        from helpers.database import SessionLocal
        db = SessionLocal()
        users = db.query(User).filter(User.role.in_(['consultant', 'platform_consultant'])).all()
        print(f"Total consultants: {len(users)}")
        for u in users:
            print(f"Consultant: {u.email}, profile: {u.profile}")
        db.close()
        print("Consultant profile query succeeded without error!")
    except Exception as e:
        import traceback
        print("Error during consultant query:")
        traceback.print_exc()
