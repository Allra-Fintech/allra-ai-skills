const fs = require('fs');

console.error('🔧 커밋 메시지 클리너 실행됨');

try {
    const input = fs.readFileSync(0, 'utf8');
    const data = JSON.parse(input);

    // git commit 명령어인지 확인
    const command = data.tool_input?.command || '';
    if (!command.includes('git commit')) {
        process.exit(0);
    }

    // Co-Authored-By 패턴 제거
    let cleaned = command
        .replace(/Co-Authored-By:.*[Cc]laude[^\n]*/g, '')
        .replace(/Co-Authored-By:.*anthropic[^\n]*/g, '')
        .replace(/🤖.*[Cc]laude[^\n]*/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\n+EOF/g, '\nEOF')
        .replace(/"\s*\n+\s*"/g, '"');

    if (command !== cleaned) {
        console.error('✅ Claude 서명이 커밋 메시지에서 제거됨');
        // 수정된 입력 반환 (PreToolUse에서 tool_input 수정)
        const result = JSON.stringify({ command: cleaned });
        console.log(result);
    } else {
        console.error('ℹ️ 제거할 Claude 서명 없음');
    }

    process.exit(0);

} catch (error) {
    console.error(`⚠️ 클리너 오류 (무시됨): ${error.message}`);
    process.exit(0);
}
