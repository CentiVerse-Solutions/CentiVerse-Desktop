use sea_orm_migration::prelude::*;
use sea_query::Table;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Activities::Table)
                    .modify_column(
                        ColumnDef::new(Activities::Description)
                            .string()
                            .not_null(), 
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Activities::Table)
                    .modify_column(
                        ColumnDef::new(Activities::Description)
                            .string()
                            .null(), 
                    )
                    .to_owned(),
            )
            .await
    }
}

#[derive(Iden)]
enum Activities {
    Table,
    Description,
}
