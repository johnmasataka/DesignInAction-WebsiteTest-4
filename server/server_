const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const UserContext = require('./server/models/UserContext');

// 初始化 Express 应用
const app = express();

// 使用中间件
app.use(bodyParser.json());
app.use(cors());

// 连接 MongoDB 数据库
mongoose.connect('mongodb://localhost:27017/design', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// 更新用户上下文接口
app.post('/update-context', async (req, res) => {
    const { userId, input } = req.body;

    if (!userId || !input) {
        return res.status(400).json({ error: 'Missing userId or input' });
    }

    try {
        // 查找用户上下文，如果不存在则创建
        let userContext = await UserContext.findOne({ userId });
        if (!userContext) {
            userContext = new UserContext({ userId, preferences: {} });
        }

        // 解析用户输入并更新上下文
        const updatedPreferences = parseInputToPreferences(input, userContext.preferences);
        userContext.preferences = updatedPreferences;

        // 保存到数据库
        await userContext.save();

        // 返回更新后的上下文
        res.json(userContext.preferences);
    } catch (error) {
        console.error('Error updating context:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 解析用户输入函数
function parseInputToPreferences(input, existingPreferences) {
    const parameters = { ...existingPreferences };

    // 示例规则：处理“再大一点”之类的输入
    if (input.includes('再大一点')) {
        parameters.width = (parameters.width || 10) + 10;
        parameters.height = (parameters.height || 10) + 10;
        parameters.depth = (parameters.depth || 10) + 10;
    }

    // 示例规则：处理“蓝色”之类的颜色输入
    if (input.includes('蓝色')) {
        parameters.color = 0x0000ff; // 蓝色
    }

    // 你可以在这里调用更复杂的 NLP 或规则解析逻辑
    return parameters;
}

// 测试接口
app.get('/', (req, res) => {
    res.send('Design in Action API is running!');
});

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
