import argparse
import sys

from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.auth.utils import hash_password
from app.config import settings
from app.models import User


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a user in the database")
    parser.add_argument("--email", required=True, help="User email address")
    parser.add_argument("--password", required=True, help="User password")
    args = parser.parse_args()

    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        user = User(email=args.email, password_hash=hash_password(args.password))
        db.add(user)
        db.commit()
        print(f"User created: {args.email}")
    except IntegrityError:
        db.rollback()
        print(f"Error: User with email '{args.email}' already exists.", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
