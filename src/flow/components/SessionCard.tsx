import React from 'react';
import { Session } from '../types/flow.types';

interface SessionCardProps {
  session: Session;
  onClick?: (session: Session) => void;
  childCount?: number;
  messageCount?: number;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onClick, childCount = 0, messageCount = 0 }) => {
  const getStatusColor = () => {
    switch (session.status) {
      case 'idle':
        return 'bg-gray-400';
      case 'active':
        return 'bg-green-500 animate-pulse';
      case 'completed':
        return 'bg-blue-500';
      case 'error':
        return 'bg-red-500';
      case 'waiting':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getTypeIcon = () => {
    switch (session.type) {
      case 'manager':
        return '👔';
      case 'supervisor':
        return '👷';
      case 'worker':
        return '⚙️';
      default:
        return '📄';
    }
  };

  const getTypeColor = () => {
    switch (session.type) {
      case 'manager':
        return 'bg-purple-100 border-purple-300 dark:bg-purple-900/20 dark:border-purple-700';
      case 'supervisor':
        return 'bg-blue-100 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700';
      case 'worker':
        return 'bg-green-100 border-green-300 dark:bg-green-900/20 dark:border-green-700';
      default:
        return 'bg-gray-100 border-gray-300 dark:bg-gray-900/20 dark:border-gray-700';
    }
  };

  return (
    <div
      onClick={() => onClick?.(session)}
      className={`rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-lg ${getTypeColor()}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getTypeIcon()}</span>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 capitalize">
              {session.type}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {session.name || session.id}
            </p>
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
      </div>
      
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
          <span>Progress</span>
          <span>{session.progress || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${session.progress || 0}%` }}
          />
        </div>
      </div>
      
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div>
          Status: <span className="capitalize font-medium">{session.status}</span>
        </div>
        <div className="flex gap-3">
          {childCount > 0 && (
            <span title="Child sessions">👥 {childCount}</span>
          )}
          {messageCount > 0 && (
            <span title="Messages">💬 {messageCount}</span>
          )}
        </div>
      </div>
      
      {session.error && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
          Error: {session.error}
        </div>
      )}
      
      {session.type === 'manager' && session.projectOverview && (
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          Project: {session.projectOverview.title}
        </div>
      )}
      
      {session.type === 'supervisor' && (
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          Component: {session.component}
        </div>
      )}
      
      {session.type === 'worker' && session.requestCall && (
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          Task: {session.requestCall.description.substring(0, 50)}...
        </div>
      )}
    </div>
  );
};

export default SessionCard;