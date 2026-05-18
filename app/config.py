from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    llm_provider: str = "mock"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-6"

    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "marketing_brain"
    postgres_user: str = "brain"
    postgres_password: str = "brain"

    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_collection: str = "lobes"

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    log_level: str = "INFO"

    @property
    def postgres_dsn(self) -> str:
        return (
            f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


settings = Settings()
