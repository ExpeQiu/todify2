const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径 - 使用实际存在的数据库文件
const dbPath = path.join(__dirname, 'data', 'todify2.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('连接数据库失败:', err.message);
        return;
    }
    console.log('已连接到SQLite数据库');
});

// Promise化的数据库查询函数
function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// 查询指定conversation_id的工作流链
async function queryWorkflowChain(conversationId) {
    console.log(`\n=== 查询conversation_id: ${conversationId} 的工作流链 ===\n`);
    
    try {
        // 1. 查询conversations表
        const conversationQuery = `
            SELECT * FROM conversations 
            WHERE conversation_id = ?
        `;
        const conversations = await query(conversationQuery, [conversationId]);
        
        if (conversations.length > 0) {
            console.log('1. Conversation记录:');
            conversations.forEach(conv => {
                console.log(`   - ID: ${conv.conversation_id}`);
                console.log(`   - 会话名: ${conv.session_name}`);
                console.log(`   - 应用类型: ${conv.app_type}`);
                console.log(`   - 创建时间: ${conv.created_at}`);
            });
        } else {
            console.log('1. 未找到Conversation记录');
        }
        
        // 2. 查询chat_messages表
        const messagesQuery = `
            SELECT * FROM chat_messages 
            WHERE conversation_id = ?
            ORDER BY created_at ASC
        `;
        const messages = await query(messagesQuery, [conversationId]);
        
        console.log(`\n2. Chat Messages记录 (${messages.length}条):`);
        messages.forEach((msg, index) => {
            console.log(`   消息${index + 1}:`);
            console.log(`   - Message ID: ${msg.message_id}`);
            console.log(`   - 类型: ${msg.message_type}`);
            console.log(`   - 应用类型: ${msg.app_type}`);
            console.log(`   - 内容长度: ${msg.content ? msg.content.length : 0} 字符`);
            console.log(`   - 创建时间: ${msg.created_at}`);
        });
        
        // 3. 查询workflow_executions表 - 通过message_id关联
        if (messages.length > 0) {
            const messageIds = messages.map(msg => msg.message_id);
            const placeholders = messageIds.map(() => '?').join(',');
            
            const workflowQuery = `
                SELECT we.*, cm.conversation_id 
                FROM workflow_executions we
                LEFT JOIN chat_messages cm ON we.message_id = cm.message_id
                WHERE we.message_id IN (${placeholders})
                ORDER BY we.created_at ASC
            `;
            const workflows = await query(workflowQuery, messageIds);
            
            console.log(`\n3. Workflow Executions记录 (${workflows.length}条):`);
            workflows.forEach((wf, index) => {
                console.log(`   工作流${index + 1}:`);
                console.log(`   - Workflow Run ID: ${wf.workflow_run_id}`);
                console.log(`   - Workflow ID: ${wf.workflow_id}`);
                console.log(`   - 应用类型: ${wf.app_type}`);
                console.log(`   - 状态: ${wf.status}`);
                console.log(`   - 关联Message ID: ${wf.message_id}`);
                console.log(`   - 关联Conversation ID: ${wf.conversation_id}`);
                console.log(`   - 创建时间: ${wf.created_at}`);
            });
        } else {
            console.log('\n3. 无Chat Messages记录，无法查询关联的Workflow Executions');
        }
        
    } catch (error) {
        console.error('查询工作流链失败:', error.message);
    }
}

// 查询最近的conversations记录
async function queryRecentConversations() {
    console.log('\n=== 最近的Conversation记录 ===\n');
    
    try {
        const recentQuery = `
            SELECT * FROM conversations 
            ORDER BY created_at DESC 
            LIMIT 5
        `;
        const conversations = await query(recentQuery);
        
        if (conversations.length > 0) {
            conversations.forEach((conv, index) => {
                console.log(`${index + 1}. Conversation:`);
                console.log(`   - ID: ${conv.conversation_id}`);
                console.log(`   - 会话名: ${conv.session_name}`);
                console.log(`   - 应用类型: ${conv.app_type}`);
                console.log(`   - 创建时间: ${conv.created_at}`);
                console.log('');
            });
        } else {
            console.log('未找到任何Conversation记录');
        }
    } catch (error) {
        console.error('查询最近conversations失败:', error.message);
    }
}

// 主函数
async function main() {
    try {
        // 查询最近的conversations
        await queryRecentConversations();
        
        // 查询指定conversation_id的工作流链
        const testConversationId = '3d78c3b0-b9e3-4afb-afa3-86aba53d0ba0';
        await queryWorkflowChain(testConversationId);
        
    } catch (error) {
        console.error('执行失败:', error.message);
    } finally {
        // 关闭数据库连接
        db.close((err) => {
            if (err) {
                console.error('关闭数据库连接失败:', err.message);
            } else {
                console.log('\n数据库连接已关闭');
            }
        });
    }
}

// 运行主函数
main();