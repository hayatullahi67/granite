
import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { Card, Input, Badge } from '../components/UI';
import { Search, Activity, User, Clock, FileText, Database, Hash, Tag } from 'lucide-react';

export const AuditTrail: React.FC = () => {
  const { auditLogs } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => 
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.recordId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [auditLogs, searchTerm]);

  const getActionColor = (action: string) => {
      const act = action.toUpperCase();
      if (act === 'CREATE' || act === 'ADD') return 'green';
      if (act === 'UPDATE' || act === 'EDIT') return 'blue';
      if (act === 'DELETE') return 'red';
      return 'purple';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-stone-900">Audit Trail</h1>
            <p className="text-stone-500 text-sm mt-1">System-wide activity logging and monitoring.</p>
        </div>
        <div className="bg-white border border-stone-200 text-stone-500 text-xs px-3 py-1.5 rounded-lg font-mono">
            Total Records: {auditLogs.length}
        </div>
      </div>

      <Card noPadding>
        {/* Toolbar */}
        <div className="p-4 border-b border-stone-100 flex items-center bg-stone-50/50">
          <div className="w-full sm:w-96">
            <Input 
              icon={Search}
              placeholder="Filter by user, action, id or details..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-100">
                <thead className="bg-stone-50">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider w-40">Timestamp</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider w-32">User</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider w-24">Action</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider w-32">Entity</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider w-40">ID</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-stone-500 uppercase tracking-wider">Details</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-50">
                    {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-stone-500">
                                    <Clock className="h-3.5 w-3.5 mr-2 text-stone-400" />
                                    {new Date(log.timestamp).toLocaleString()}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="h-6 w-6 rounded-full bg-stone-100 text-xs flex items-center justify-center text-stone-600 font-bold mr-2">
                                        {log.userName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-stone-900">{log.userName}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <Badge color={getActionColor(log.action)}>{log.action}</Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-xs font-bold text-stone-600 uppercase">
                                     <Database className="h-3.5 w-3.5 mr-1.5 text-stone-400" />
                                     {log.entity}
                                </div>
                            </td>
                             <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-xs font-mono text-stone-500 bg-stone-50 px-2 py-1 rounded border border-stone-100 w-fit">
                                     <Hash className="h-3 w-3 mr-1 text-stone-300" />
                                     {log.recordId}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-stone-600 flex items-start">
                                    <FileText className="h-3.5 w-3.5 mr-2 mt-0.5 text-stone-400 shrink-0" />
                                    {log.details}
                                </div>
                            </td>
                        </tr>
                    ))}
                     {filteredLogs.length === 0 && (
                        <tr><td colSpan={6} className="p-12 text-center text-stone-400">
                            <Activity className="h-10 w-10 mx-auto mb-2 opacity-20" />
                            No activity logs found.
                        </td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </Card>
    </div>
  );
};
