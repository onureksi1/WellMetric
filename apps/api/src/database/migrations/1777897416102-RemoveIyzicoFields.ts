import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveIyzicoFields1777897416102 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            -- subscriptions tablosundan iyzico alanları
            ALTER TABLE subscriptions 
                DROP COLUMN IF EXISTS iyzico_subscription_id,
                DROP COLUMN IF EXISTS iyzico_card_token,
                DROP COLUMN IF EXISTS iyzico_card_user_key;

            -- consultant_payment_methods tablosundan iyzico alanları
            ALTER TABLE consultant_payment_methods
                DROP COLUMN IF EXISTS iyzico_card_user_key,
                DROP COLUMN IF EXISTS iyzico_card_token,
                DROP COLUMN IF EXISTS iyzico_card_alias,
                DROP COLUMN IF EXISTS iyzico_last4;

            -- provider='iyzico' olan ödeme yöntemlerini sil
            DELETE FROM consultant_payment_methods WHERE provider = 'iyzico';
            
            -- payments tablosunda provider='iyzico' olanları da temizleyebiliriz veya bırakabiliriz (tarihçe için)
            -- Kullanıcı özellikle belirtmediği için payments tablosuna dokunmuyorum.
        `);

        // platform_settings'ten iyzico provider'ı kaldır (JSON güncelleme)
        await queryRunner.query(`
            UPDATE platform_settings 
            SET payment_settings = payment_settings #- '{providers,iyzico}'
            WHERE payment_settings -> 'providers' -> 'iyzico' IS NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Geri dönüş genellikle zor JSON ve silinen kolonlar için, ama gerekirse eklenebilir.
    }

}
