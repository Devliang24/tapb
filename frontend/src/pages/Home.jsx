import { Card, Typography } from 'antd';
import useAuthStore from '../stores/authStore';

const { Title, Paragraph } = Typography;

const Home = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <div>
      <Card>
        <Title level={2}>欢迎使用 TAPB Bug 管理系统</Title>
        {isAuthenticated ? (
          <Paragraph>
            你好，{user?.username}！你可以开始管理项目和 Bug 了。
          </Paragraph>
        ) : (
          <Paragraph>
            请先登录或注册以使用系统功能。
          </Paragraph>
        )}
        
        <Title level={4}>系统功能</Title>
        <ul>
          <li>✅ 用户认证与权限管理</li>
          <li>✅ 项目管理</li>
          <li>✅ Bug 管理（创建、编辑、删除、状态流转）</li>
          <li>✅ 批量操作</li>
          <li>✅ 评论系统（支持 Markdown）</li>
          <li>✅ 搜索与筛选</li>
        </ul>
      </Card>
    </div>
  );
};

export default Home;
