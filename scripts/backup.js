import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { config } from '../server/config/environment.js';

const execAsync = promisify(exec);

class BackupManager {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || './backups';
    this.ensureBackupDir();
  }

  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createDatabaseBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `db-backup-${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    const command = `pg_dump -h ${config.database.host} -p ${config.database.port} -U ${config.database.user} -d ${config.database.name} -f ${filepath}`;

    try {
      console.log('🗄️ Creating database backup...');
      await execAsync(command, {
        env: { ...process.env, PGPASSWORD: config.database.password }
      });
      
      console.log(`✅ Database backup created: ${filename}`);
      return filepath;
    } catch (error) {
      console.error('❌ Database backup failed:', error);
      throw error;
    }
  }

  async createFileBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `files-backup-${timestamp}.tar.gz`;
    const filepath = path.join(this.backupDir, filename);

    const command = `tar -czf ${filepath} ${config.upload.path}`;

    try {
      console.log('📁 Creating file backup...');
      await execAsync(command);
      
      console.log(`✅ File backup created: ${filename}`);
      return filepath;
    } catch (error) {
      console.error('❌ File backup failed:', error);
      throw error;
    }
  }

  async cleanOldBackups(retentionDays = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const files = fs.readdirSync(this.backupDir);
      let deletedCount = 0;

      for (const file of files) {
        const filepath = path.join(this.backupDir, file);
        const stats = fs.statSync(filepath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filepath);
          deletedCount++;
          console.log(`🗑️ Deleted old backup: ${file}`);
        }
      }

      console.log(`✅ Cleanup completed. ${deletedCount} old backups removed.`);
    } catch (error) {
      console.error('❌ Backup cleanup failed:', error);
    }
  }

  async runFullBackup() {
    try {
      console.log('🚀 Starting full backup process...');
      
      await Promise.all([
        this.createDatabaseBackup(),
        this.createFileBackup()
      ]);
      
      await this.cleanOldBackups();
      
      console.log('✅ Full backup completed successfully!');
    } catch (error) {
      console.error('❌ Full backup failed:', error);
      process.exit(1);
    }
  }
}

// Run backup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const backupManager = new BackupManager();
  backupManager.runFullBackup();
}

export default BackupManager;