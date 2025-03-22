use sea_orm_migration::prelude::*;
use sea_query::Table;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(FriendCollections::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(FriendCollections::Id)
                            .uuid()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(FriendCollections::UserId).uuid().not_null())
                    .col(ColumnDef::new(FriendCollections::FriendId).uuid().not_null())
                    .col(ColumnDef::new(FriendCollections::Status).string().not_null())
                    .col(
                        ColumnDef::new(FriendCollections::CreatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new(FriendCollections::UpdatedAt)
                            .timestamp_with_time_zone()
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await
    }
    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(FriendCollections::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum FriendCollections {
    Table,
    Id,
    UserId,
    FriendId,
    Status,
    CreatedAt,
    UpdatedAt,
}
