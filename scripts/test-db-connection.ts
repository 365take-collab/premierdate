// データベース接続テストスクリプト
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('データベース接続をテストしています...');
    
    // 接続テスト
    await prisma.$connect();
    console.log('✅ データベース接続成功！');
    
    // テーブル一覧を取得
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('\n📊 作成されたテーブル:');
    console.log(tables);
    
    // Userテーブルの件数を確認
    const userCount = await prisma.user.count();
    console.log(`\n👤 Userテーブルの件数: ${userCount}`);
    
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();



