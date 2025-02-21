import asyncio
import sqlalchemy
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

DATABASE_URL = "postgresql+asyncpg://admin:QwErTyUiOp@db:5432/thamer"

# Define the async engine
engine = create_async_engine(DATABASE_URL, echo=True)

# Define the session factory
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# Define the base class for models
Base = declarative_base()

# Example model
class ExampleModel(Base):
    __tablename__ = "example_model"
    id = sqlalchemy.Column(sqlalchemy.Integer, primary_key=True)
    name = sqlalchemy.Column(sqlalchemy.String)

async def test_db():
    async with engine.begin() as conn:
        # Create all tables in the database
        await conn.run_sync(Base.metadata.create_all)
    async with async_session() as session:
        async with session.begin():
            # Example operation
            new_entry = ExampleModel(name="Test")
            session.add(new_entry)
            await session.commit()

if __name__ == "__main__":
    asyncio.run(test_db())
