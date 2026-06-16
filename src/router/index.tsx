import { createHashRouter, Navigate, type RouteObject } from 'react-router-dom';
import React from 'react';
import { useAuthStore } from '../stores/authStore';
import UrgentList from '../pages/urgent/UrgentList';
import UrgentPublish from '../pages/urgent/UrgentPublish';
import UrgentDetail from '../pages/urgent/UrgentDetail';
import StockList from '../pages/stock/StockList';
import StockDetail from '../pages/stock/StockDetail';
import ReputationHome from '../pages/reputation/ReputationHome';
import QuickList from '../pages/reputation/QuickList';
import PeerProfile from '../pages/reputation/PeerProfile';
import OrderList from '../pages/order/OrderList';
import OrderDetail from '../pages/order/OrderDetail';
import DisputePage from '../pages/order/DisputePage';
import MessageList from '../pages/message/MessageList';
import ChatRoom from '../pages/message/ChatRoom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/urgent" replace />;
  }

  return <>{children}</>;
};

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/urgent" replace />,
  },
  {
    path: '/urgent',
    element: <UrgentList />,
  },
  {
    path: '/urgent/publish',
    element: (
      <ProtectedRoute>
        <UrgentPublish />
      </ProtectedRoute>
    ),
  },
  {
    path: '/urgent/:id',
    element: <UrgentDetail />,
  },
  {
    path: '/stock',
    element: <StockList />,
  },
  {
    path: '/stock/:id',
    element: <StockDetail />,
  },
  {
    path: '/reputation',
    element: <ReputationHome />,
  },
  {
    path: '/reputation/list',
    element: <QuickList />,
  },
  {
    path: '/reputation/:userId',
    element: <PeerProfile />,
  },
  {
    path: '/order',
    element: (
      <ProtectedRoute>
        <OrderList />
      </ProtectedRoute>
    ),
  },
  {
    path: '/order/:id',
    element: (
      <ProtectedRoute>
        <OrderDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: '/order/:id/dispute',
    element: (
      <ProtectedRoute>
        <DisputePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/message',
    element: (
      <ProtectedRoute>
        <MessageList />
      </ProtectedRoute>
    ),
  },
  {
    path: '/message/:chatId',
    element: (
      <ProtectedRoute>
        <ChatRoom />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/urgent" replace />,
  },
];

const router = createHashRouter(routes);

export default router;
export { routes, ProtectedRoute };
