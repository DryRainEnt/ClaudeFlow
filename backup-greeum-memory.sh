#!/bin/bash

# 🧚‍♀️ Fairy Assistant - Greeum Memory Backup Script
# 이 스크립트는 프로젝트와 함께 Greeum 메모리 데이터베이스를 백업합니다.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
MEMORY_DB="$PROJECT_ROOT/data/memory.db"
BACKUP_DIR="$PROJECT_ROOT/data/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🔄 Greeum Memory Backup System"
echo "================================"

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

# 메모리 DB 존재 확인
if [ -f "$MEMORY_DB" ]; then
    echo "✅ Found memory database: $MEMORY_DB"
    
    # 백업 실행
    BACKUP_FILE="$BACKUP_DIR/memory_backup_$TIMESTAMP.db"
    cp "$MEMORY_DB" "$BACKUP_FILE"
    
    echo "✅ Backup created: $BACKUP_FILE"
    
    # 압축 백업 (선택사항)
    if command -v gzip &> /dev/null; then
        gzip -c "$MEMORY_DB" > "$BACKUP_DIR/memory_backup_$TIMESTAMP.db.gz"
        echo "✅ Compressed backup: memory_backup_$TIMESTAMP.db.gz"
    fi
    
    # 백업 검증
    ORIGINAL_SIZE=$(stat -f%z "$MEMORY_DB" 2>/dev/null || stat -c%s "$MEMORY_DB")
    BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE")
    
    if [ "$ORIGINAL_SIZE" -eq "$BACKUP_SIZE" ]; then
        echo "✅ Backup verification: SUCCESS ($ORIGINAL_SIZE bytes)"
    else
        echo "❌ Backup verification: FAILED (size mismatch)"
        exit 1
    fi
    
    # 최신 백업 심볼릭 링크 생성
    ln -sf "memory_backup_$TIMESTAMP.db" "$BACKUP_DIR/latest_backup.db"
    echo "✅ Latest backup symlink updated"
    
else
    echo "⚠️  Memory database not found: $MEMORY_DB"
    echo "🔍 Searching for memory files..."
    
    find "$PROJECT_ROOT" -name "*.db" -o -name "memory*" 2>/dev/null | head -5
    
    echo "💡 If this is a fresh project, this is normal."
fi

# 백업 정리 (30일 이상 된 백업 삭제)
echo ""
echo "🧹 Cleaning old backups..."
find "$BACKUP_DIR" -name "memory_backup_*.db*" -mtime +30 -delete 2>/dev/null
echo "✅ Old backups cleaned (>30 days)"

# 백업 통계
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/memory_backup_*.db 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)

echo ""
echo "📊 Backup Statistics"
echo "   • Total backups: $BACKUP_COUNT"
echo "   • Total size: ${TOTAL_SIZE:-"N/A"}"
echo "   • Latest: $TIMESTAMP"

echo ""
echo "🎉 Backup complete! Ready for commit."