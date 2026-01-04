#!/bin/bash

echo "🚀 启动 TAPB 开发环境..."
echo ""

# 检查 Docker 是否运行
if docker info > /dev/null 2>&1; then
    echo "✅ Docker 已运行，使用 Docker Compose 启动"
    echo ""
    docker-compose up -d
    echo ""
    echo "📊 服务状态："
    docker-compose ps
    echo ""
    echo "📝 查看日志："
    echo "  docker-compose logs -f"
    echo ""
else
    echo "⚠️  Docker 未运行，使用本地方式启动"
    echo ""
    
    # 启动后端
    echo "🔧 启动后端服务..."
    cd backend
    ./start.sh > backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    sleep 3
    
    # 检查后端
    if curl -s http://localhost:8000/health > /dev/null; then
        echo "✅ 后端启动成功 (PID: $BACKEND_PID)"
    else
        echo "❌ 后端启动失败"
        exit 1
    fi
    
    echo ""
    echo "⏳ 准备启动前端..."
    echo "   (首次启动需要安装依赖，可能需要几分钟)"
    echo ""
    
    # 启动前端（前台运行）
    cd frontend
    npm run dev
fi

echo ""
echo "🎉 开发环境已启动！"
echo ""
echo "📍 访问地址："
echo "   前端: http://localhost:5173"
echo "   后端 API: http://localhost:8000"
echo "   API 文档: http://localhost:8000/docs"
