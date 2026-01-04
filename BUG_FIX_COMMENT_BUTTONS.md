# Bug修复总结 - 评论操作按钮不显示

## 问题描述
评论区域显示了"(已编辑)"标记，但是编辑和删除按钮没有显示出来。

## 问题原因
1. **authStore未持久化用户信息**：登录时虽然设置了user信息到state，但页面刷新后user信息丢失（只有token被保存到localStorage）
2. **缺少初始化逻辑**：应用启动时没有检查并恢复用户信息
3. **权限判断失败**：由于`currentUser`为null，导致权限判断`currentUser && comment.user_id === currentUser.id`始终为false，按钮不显示

## 修复方案

### 1. 修复authStore持久化 (`frontend/src/stores/authStore.js`)

**修改前：**
```javascript
const useAuthStore = create((set) => ({
  user: null,  // 每次刷新都为null
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  setAuth: (user, token) => {
    localStorage.setItem('token', token);  // 只保存token
    set({ user, token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
```

**修改后：**
```javascript
// 从localStorage读取user信息
const getUserFromStorage = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    return null;
  }
};

const useAuthStore = create((set) => ({
  user: getUserFromStorage(),  // ✅ 从localStorage恢复
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));  // ✅ 保存user
    set({ user, token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');  // ✅ 清除user
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
```

### 2. 添加用户信息初始化 (`frontend/src/components/Layout/index.jsx`)

新增useEffect，在应用启动时检查token并自动获取用户信息：

```javascript
// Initialize user info if token exists but user is null
useEffect(() => {
  const initializeUser = async () => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      try {
        const userInfo = await authService.getCurrentUser();
        setAuth(userInfo, token);
      } catch (error) {
        // Token is invalid, clear it
        logout();
      }
    }
  };
  initializeUser();
}, [user, setAuth, logout]);
```

## 修复效果

✅ **页面刷新后用户信息保持**：user信息从localStorage恢复  
✅ **首次访问自动获取**：如果有token但没有user，自动调用API获取  
✅ **按钮正常显示**：权限判断`currentUser && comment.user_id === currentUser.id`正常工作  
✅ **编辑/删除功能可用**：只有评论作者可以看到并使用操作按钮

## 测试步骤

1. **清除浏览器数据**：清除localStorage和cookie
2. **登录账号**：使用admin@tapb.com登录
3. **创建评论**：在Bug详情页创建评论
4. **验证按钮显示**：应该看到"编辑"和"删除"按钮
5. **刷新页面**：F5刷新浏览器
6. **验证按钮仍显示**：刷新后按钮应该仍然显示
7. **测试编辑功能**：点击编辑，修改内容并保存
8. **验证编辑标记**：应该看到"(已编辑)"标记
9. **测试删除功能**：点击删除，确认后评论被删除

## 相关文件

- `frontend/src/stores/authStore.js` - 用户状态管理（已修复）
- `frontend/src/components/Layout/index.jsx` - 布局组件（已添加初始化逻辑）
- `frontend/src/components/BugDetail/index.jsx` - Bug详情组件（包含评论功能）

## 注意事项

- 旧的登录session需要重新登录才能生效（因为之前没有保存user信息）
- 如果用户清除了localStorage，需要重新登录
- Token过期时会自动登出并清除用户信息
