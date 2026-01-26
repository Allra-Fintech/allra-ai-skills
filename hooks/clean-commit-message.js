const fs = require('fs');
const { execSync } = require('child_process');

console.error('🔧 커밋 메시지 클리너 실행됨');

try {
    const input = fs.readFileSync(0, 'utf8');
    const data = JSON.parse(input);

    // git commit 명령어인지 확인
    const command = data.tool_input?.command || '';
    if (!command.includes('git commit')) {
        process.exit(0);
    }

    // 마지막 커밋 메시지에서 Claude 관련 내용 제거
    const msg = execSync('git log -1 --format=%B', { encoding: 'utf8' });

    const cleaned = msg
        .replace(/\n*Co-Authored-By:.*Claude.*$/gim, '')
        .replace(/\n*Co-Authored-By:.*anthropic.*$/gim, '')
        .replace(/\n*🤖.*Claude.*$/gim, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    if (msg.trim() !== cleaned) {
        // 쌍따옴표 이스케이프 처리
        const escapedMsg = cleaned.replace(/"/g, '\\"');
        execSync(`git commit --amend -m "${escapedMsg}"`, { stdio: 'pipe' });
        console.error('✅ Claude 서명 제거됨');
    } else {
        console.error('ℹ️ 제거할 Claude 서명 없음');
    }

    process.exit(0);

} catch (error) {
    console.error(`⚠️ 클리너 오류 (무시됨): ${error.message}`);
    process.exit(0); // 오류 시에도 작업 진행
}
