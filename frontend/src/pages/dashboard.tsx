import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Plus,
  Folder,
  FileText,
  Search,
  MoreVertical,
  Calendar,
  Clock,
  User,
  Users,
  DollarSign,
  Settings,
  Lock,
  PieChart,
  BarChart,
  Mic,
  Upload,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

// Mock data for sessions
const MOCK_SESSIONS: Session[] = [
  {
    id: 'session-1',
    title: 'John Smith Progress Report',
    client: 'John Smith',
    type: 'Progress Report',
    status: 'draft',
    lastUpdated: '2025-04-21T14:30:00Z',
    createdAt: '2025-04-20T10:15:00Z'
  },
  {
    id: 'session-2',
    title: 'Sarah Johnson Assessment',
    client: 'Sarah Johnson',
    type: 'Assessment Report',
    status: 'completed',
    lastUpdated: '2025-04-19T16:45:00Z',
    createdAt: '2025-04-18T09:20:00Z'
  },
  {
    id: 'session-3',
    title: 'Michael Brown Therapy Summary',
    client: 'Michael Brown',
    type: 'Therapy Report',
    status: 'in-progress',
    lastUpdated: '2025-04-17T11:10:00Z',
    createdAt: '2025-04-17T09:30:00Z'
  }
];

type Session = {
  id: string;
  title: string;
  client: string;
  type: string;
  status: 'draft' | 'in-progress' | 'completed';
  lastUpdated: string;
  createdAt: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'lastUpdated' | 'createdAt' | 'title'>('lastUpdated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Load sessions data
  useEffect(() => {
    // Simulate API call
    const loadSessions = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSessions(MOCK_SESSIONS);
      } catch (error) {
        console.error('Error loading sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSessions();
  }, []);
  
  // Filter and sort sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = searchQuery === '' || 
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.client.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = filterStatus === null || session.status === filterStatus;
    const matchesType = filterType === null || session.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  }).sort((a, b) => {
    if (sortBy === 'title') {
      return sortOrder === 'asc' 
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else {
      const dateA = new Date(a[sortBy]);
      const dateB = new Date(b[sortBy]);
      return sortOrder === 'asc' 
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    }
  });
  
  // Get unique report types for filtering
  const reportTypes = Array.from(new Set(sessions.map(session => session.type)));
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Handle creating a new report session
  const handleNewReport = () => {
    router.push('/reports/new');
  };
  
  // Handle opening a report
  const handleOpenReport = (sessionId: string) => {
    router.push(`/reports/builder?id=${sessionId}`);
  };
  
  // Toggle sort order
  const toggleSort = (field: 'lastUpdated' | 'createdAt' | 'title') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  // Render status badge
  const renderStatusBadge = (status: string) => {
    let bgColor = '';
    let textColor = '';
    
    switch (status) {
      case 'draft':
        bgColor = 'bg-secondary/80';
        textColor = 'text-secondary-foreground';
        break;
      case 'in-progress':
        bgColor = 'bg-primary/20';
        textColor = 'text-primary';
        break;
      case 'completed':
        bgColor = 'bg-green-500/20';
        textColor = 'text-green-600 dark:text-green-400';
        break;
    }
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${bgColor} ${textColor}`}>
        {status.replace('-', ' ')}
      </span>
    );
  };
  
  // Note: removed duplicate handleNewReport declaration that caused redeclare error
  
  return (
    <>
      <Head>
        <title>Dashboard | NDISuite Report Generator</title>
      </Head>
      
      {/* Feature Territories */}
      <div className="dashboard-grid">
        {/* Report Panel Territory */}
        <div className="feature-territory col-span-2 row-span-2 shadow-hover">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center">
                <FileText className="mr-2 text-primary" size={22} />
                Report Panel
              </h2>
              <p className="text-muted-foreground text-sm mt-1">Manage and create NDIS reports</p>
            </div>
            <button
              onClick={handleNewReport}
              className="flex items-center px-3 py-2 bg-primary/10 hover:bg-primary/15 text-primary transition-all duration-200 rounded-md text-sm font-medium shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Report
            </button>
          </div>

          {/* Report Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus || 'all'}
              onChange={(e) => setFilterStatus(e.target.value === 'all' ? '' : e.target.value)}
              className="px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Recent Reports List */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="overflow-hidden">
              <table className="w-full divide-y divide-border table-fixed">
                <thead className="bg-muted/30">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[35%]">
                      Report Title
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[20%]">
                      Client
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[15%]">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[25%]">
                      Updated
                    </th>
                    <th scope="col" className="relative px-2 py-3 w-[5%]">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Folder className="h-12 w-12 text-muted-foreground mb-3" />
                          <p className="text-lg font-medium">No reports found</p>
                          <p className="text-sm mt-1 text-muted-foreground">Create a new report or adjust your filters</p>
                          <button
                            onClick={handleNewReport}
                            className="mt-4 px-4 py-2 bg-primary hover:bg-primary/90 rounded-md text-primary-foreground transition-colors"
                          >
                            Create a report
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => router.push(`/reports/builder?id=${session.id}`)}>
                        <td className="px-3 py-4 truncate">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-primary mr-3" />
                            <div>
                              <div className="font-medium">{session.title}</div>
                              <div className="text-xs text-muted-foreground">
                                Created {new Date(session.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 truncate">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-muted-foreground mr-2" />
                            <span>{session.client}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 truncate">
                          {renderStatusBadge(session.status)}
                        </td>
                        <td className="px-3 py-4 truncate text-sm">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                            <span>{new Date(session.lastUpdated).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-right text-sm">
                          <button className="p-1 rounded hover:bg-muted/30 transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Scheduling - Coming Soon */}
        <div className="feature-territory">
            {/* Coming Soon Overlay with tag in top-right */}
            <div className="coming-soon-overlay">
              <div className="absolute top-2 right-2 z-10">
                <span className="px-3 py-1 bg-primary/10 rounded-md text-xs font-medium text-primary border border-primary/20 shadow-sm">
                  Coming Soon
                </span>
              </div>
            </div>
          <div className="opacity-50">
            <h2 className="text-xl font-semibold flex items-center">
              <Calendar className="mr-2 text-primary" size={22} />
              Scheduling
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Manage appointments and reminders</p>
            
            <div className="mt-4 grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="aspect-square border border-border rounded-sm flex items-center justify-center">
                  <span className="text-xs">{i + 15}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center p-2 border border-border rounded-md">
                  <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                  <div className="text-xs">Example Appointment</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Billing - Coming Soon */}
        <div className="feature-territory">
            {/* Coming Soon Overlay with tag in top-right */}
            <div className="coming-soon-overlay">
              <div className="absolute top-2 right-2 z-10">
                <span className="px-3 py-1 bg-primary/10 rounded-md text-xs font-medium text-primary border border-primary/20 shadow-sm">
                  Coming Soon
                </span>
              </div>
            </div>
          <div className="opacity-50">
            <h2 className="text-xl font-semibold flex items-center">
              <DollarSign className="mr-2 text-primary" size={22} />
              Billing
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Track payments and invoices</p>
            
            <div className="mt-4">
              <div className="h-24 flex items-end space-x-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-primary/30 w-full rounded-t-sm" 
                    style={{ height: `${30 + Math.random() * 70}%` }}
                  ></div>
                ))}
              </div>
              <div className="h-4 border-t border-border mt-1 flex justify-between">
                <span className="text-xs text-muted-foreground">Mon</span>
                <span className="text-xs text-muted-foreground">Fri</span>
              </div>
            </div>
          </div>
        </div>

        {/* Clients - Coming Soon */}
        <div className="feature-territory">
            {/* Coming Soon Overlay with tag in top-right */}
            <div className="coming-soon-overlay">
              <div className="absolute top-2 right-2 z-10">
                <span className="px-3 py-1 bg-primary/10 rounded-md text-xs font-medium text-primary border border-primary/20 shadow-sm">
                  Coming Soon
                </span>
              </div>
            </div>
          <div className="opacity-50">
            <h2 className="text-xl font-semibold flex items-center">
              <Users className="mr-2 text-primary" size={22} />
              Clients
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Manage client information</p>
            
            <div className="mt-4 flex gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="border border-border rounded-md p-3 flex-1">
                  <div className="w-8 h-8 bg-muted rounded-full mb-2 flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <div className="h-2 w-20 bg-muted rounded-full mb-2"></div>
                  <div className="h-2 w-16 bg-muted rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Hub - Coming Soon */}
        <div className="feature-territory">
            {/* Coming Soon Overlay with tag in top-right */}
            <div className="coming-soon-overlay">
              <div className="absolute top-2 right-2 z-10">
                <span className="px-3 py-1 bg-primary/10 rounded-md text-xs font-medium text-primary border border-primary/20 shadow-sm">
                  Coming Soon
                </span>
              </div>
            </div>
          <div className="opacity-50">
            <h2 className="text-xl font-semibold flex items-center">
              <Users className="mr-2 text-primary" size={22} />
              Team Hub
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Collaborate with your team</p>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="flex -space-x-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-card bg-muted flex items-center justify-center">
                    <span className="text-xs font-medium">T{i+1}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">3 team members</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
