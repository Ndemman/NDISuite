import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Plus,
  FileText,
  Search,
  Clock,
  Filter,
  BarChart2,
  User,
  Calendar,
  Tag,
  CheckCircle,
  AlertCircle,
  Clock3,
  MoreHorizontal,
  Download,
  Archive,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

// Mock data for reports
const MOCK_REPORTS: Report[] = [
  {
    id: 'report-1',
    title: 'John Smith Progress Report',
    client: 'John Smith',
    type: 'Progress Report',
    status: 'draft',
    lastUpdated: '2025-04-21T14:30:00Z',
    createdAt: '2025-04-20T10:15:00Z',
    template: 'NDIS Progress Report'
  },
  {
    id: 'report-2',
    title: 'Sarah Johnson Assessment',
    client: 'Sarah Johnson',
    type: 'Assessment Report',
    status: 'completed',
    lastUpdated: '2025-04-19T16:45:00Z',
    createdAt: '2025-04-18T09:20:00Z',
    template: 'NDIS Assessment'
  },
  {
    id: 'report-3',
    title: 'Michael Brown Therapy Summary',
    client: 'Michael Brown',
    type: 'Therapy Report',
    status: 'in-progress',
    lastUpdated: '2025-04-17T11:10:00Z',
    createdAt: '2025-04-17T09:30:00Z',
    template: 'Therapy Session'
  },
  {
    id: 'report-4',
    title: 'Emily Wilson Initial Assessment',
    client: 'Emily Wilson',
    type: 'Assessment Report',
    status: 'draft',
    lastUpdated: '2025-04-16T13:20:00Z',
    createdAt: '2025-04-16T10:05:00Z',
    template: 'NDIS Assessment'
  },
  {
    id: 'report-5',
    title: 'David Thompson Quarterly Report',
    client: 'David Thompson',
    type: 'Progress Report',
    status: 'completed',
    lastUpdated: '2025-04-15T15:30:00Z',
    createdAt: '2025-04-14T09:45:00Z',
    template: 'NDIS Progress Report'
  },
  {
    id: 'report-6',
    title: 'Rebecca Martinez Therapy Review',
    client: 'Rebecca Martinez',
    type: 'Therapy Report',
    status: 'in-progress',
    lastUpdated: '2025-04-13T10:25:00Z',
    createdAt: '2025-04-12T11:10:00Z',
    template: 'Therapy Session'
  }
];

// Type definition for reports
type Report = {
  id: string;
  title: string;
  client: string;
  type: string;
  status: 'draft' | 'in-progress' | 'completed';
  lastUpdated: string;
  createdAt: string;
  template: string;
};

export default function ReportsPanel() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'lastUpdated' | 'createdAt' | 'title'>('lastUpdated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 5; // Number of reports to show per page

  // Get filtered and sorted reports
  const filteredReports = reports.filter(report => {
    // Filter by search query
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by status
    const matchesStatus = !filterStatus || report.status === filterStatus;
    
    // Filter by type
    const matchesType = !filterType || report.type === filterType;
    
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
  
  // Pagination logic
  const totalReports = filteredReports.length;
  const totalPages = Math.ceil(totalReports / reportsPerPage);
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);
  
  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Calculate report statistics
  const reportStats = {
    total: reports.length,
    draft: reports.filter(r => r.status === 'draft').length,
    inProgress: reports.filter(r => r.status === 'in-progress').length,
    completed: reports.filter(r => r.status === 'completed').length
  };
  
  // Get unique report types for filtering
  const reportTypes = Array.from(new Set(reports.map(report => report.type)));
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Calculate relative time for display
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return formatDate(dateString);
    }
  };
  
  // Handle creating a new report
  const handleNewReport = () => {
    router.push('/reports/new');
  };

  // Handle opening a report
  const handleOpenReport = (reportId: string) => {
    router.push(`/reports/builder?id=${reportId}`);
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

  // Simulate data refresh
  const refreshData = () => {
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    let bgColor = '';
    let textColor = '';
    let icon = null;
    
    switch (status) {
      case 'draft':
        bgColor = 'bg-secondary/80';
        textColor = 'text-secondary-foreground';
        icon = <Clock3 className="mr-1 h-3 w-3" />;
        break;
      case 'in-progress':
        bgColor = 'bg-primary/20';
        textColor = 'text-primary';
        icon = <RefreshCw className="mr-1 h-3 w-3" />;
        break;
      case 'completed':
        bgColor = 'bg-green-500/20';
        textColor = 'text-green-600 dark:text-green-400';
        icon = <CheckCircle className="mr-1 h-3 w-3" />;
        break;
    }
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${bgColor} ${textColor} flex items-center`}>
        {icon}
        {status.replace('-', ' ')}
      </span>
    );
  };

  return (
    <>
      <Head>
        <title>Report Panel | NDISuite Report Generator</title>
      </Head>
      
      <div className="mb-8">
        {/* Page Header with Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Report Panel</h1>
            <p className="text-muted-foreground">Manage and create NDIS reports</p>
          </div>
          <button
            onClick={handleNewReport}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-md transition-all hover:bg-primary/90 shadow-sm focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
            aria-label="Create new report"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg shadow-sm border border-border/40 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Total Reports</h3>
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold mt-2">{reportStats.total}</p>
          </div>
          
          <div className="bg-card rounded-lg shadow-sm border border-border/40 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Draft</h3>
              <Clock3 className="h-5 w-5 text-secondary" />
            </div>
            <p className="text-2xl font-bold mt-2">{reportStats.draft}</p>
          </div>
          
          <div className="bg-card rounded-lg shadow-sm border border-border/40 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">In Progress</h3>
              <RefreshCw className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold mt-2">{reportStats.inProgress}</p>
          </div>
          
          <div className="bg-card rounded-lg shadow-sm border border-border/40 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{reportStats.completed}</p>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="bg-card rounded-lg shadow-sm border border-border/40 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                aria-label="Search reports"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterStatus || ''}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              
              <select
                value={filterType || ''}
                onChange={(e) => setFilterType(e.target.value === '' ? null : e.target.value)}
                className="px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Filter by report type"
              >
                <option value="">All Types</option>
                {reportTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              
              <button 
                onClick={refreshData} 
                className="p-2 rounded-md bg-background border border-input hover:bg-muted/30 transition-colors focus:ring-2 focus:ring-primary focus:outline-none"
                disabled={isLoading}
                aria-label="Refresh reports"
              >
                <RefreshCw className={`h-5 w-5 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Report Templates Section */}
        <div className="bg-card rounded-lg shadow-sm border border-border/40 p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Report Templates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div onClick={handleNewReport} className="bg-background rounded-md p-4 border border-border/40 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center mb-2">
                <FileText className="h-5 w-5 text-primary mr-2" />
                <h3 className="font-medium">NDIS Progress Report</h3>
              </div>
              <p className="text-sm text-muted-foreground">Standard progress report for NDIS participants</p>
            </div>
            
            <div onClick={handleNewReport} className="bg-background rounded-md p-4 border border-border/40 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center mb-2">
                <FileText className="h-5 w-5 text-primary mr-2" />
                <h3 className="font-medium">NDIS Assessment</h3>
              </div>
              <p className="text-sm text-muted-foreground">Comprehensive assessment report template</p>
            </div>
            
            <div onClick={handleNewReport} className="bg-background rounded-md p-4 border border-border/40 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center mb-2">
                <FileText className="h-5 w-5 text-primary mr-2" />
                <h3 className="font-medium">Therapy Session</h3>
              </div>
              <p className="text-sm text-muted-foreground">Session notes and outcomes template</p>
            </div>
          </div>
        </div>
        
        {/* Reports Table */}
        <div className="bg-card rounded-lg shadow-sm border border-border/40 overflow-hidden">
          <div className="p-4 border-b border-border/40 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Your Reports</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/30'} focus:ring-2 focus:ring-primary focus:outline-none`}
                aria-label="Switch to list view"
                aria-pressed={viewMode === 'list'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/30'} focus:ring-2 focus:ring-primary focus:outline-none`}
                aria-label="Switch to grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </button>
            </div>
          </div>
          
          {viewMode === 'list' ? (
            <div className="overflow-hidden">
              <table className="w-full divide-y divide-border table-fixed" role="grid" aria-label="Reports list">
                <thead className="bg-muted/30">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[35%] cursor-pointer" onClick={() => toggleSort('title')}>
                      <div className="flex items-center">
                        Report Title
                        {sortBy === 'title' && (
                          sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[15%]">
                      Client
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[15%]">
                      Type
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[15%]">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-[15%] cursor-pointer" onClick={() => toggleSort('lastUpdated')}>
                      <div className="flex items-center">
                        Updated
                        {sortBy === 'lastUpdated' && (
                          sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="relative px-2 py-3 w-[5%]">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                          <p className="text-lg font-medium">No reports found</p>
                          <p className="text-sm mt-1 text-muted-foreground">Create a new report or adjust your filters</p>
                          <button
                            onClick={handleNewReport}
                            className="mt-4 px-4 py-2 bg-primary hover:bg-primary/90 rounded-md text-primary-foreground transition-colors focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
                            aria-label="Create a new report"
                          >
                            Create a report
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentReports.map((report) => (
                      <tr key={report.id} className="hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => handleOpenReport(report.id)}>
                        <td className="px-3 py-4 truncate">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                            <div className="truncate">
                              <div className="font-medium truncate">{report.title}</div>
                              <div className="text-xs text-muted-foreground">
                                Created {formatDate(report.createdAt)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 truncate">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
                            <span className="truncate">{report.client}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 truncate">
                          <span className="px-2 py-1 text-xs rounded-full bg-muted/50 text-foreground/80">
                            {report.type}
                          </span>
                        </td>
                        <td className="px-3 py-4 truncate">
                          {renderStatusBadge(report.status)}
                        </td>
                        <td className="px-3 py-4 truncate text-sm">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
                            <span className="truncate">{getRelativeTime(report.lastUpdated)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-right text-sm">
                          <button 
                          className="p-1 rounded hover:bg-muted/30 transition-colors focus:ring-2 focus:ring-primary focus:outline-none" 
                          aria-label="More options"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-lg font-medium">No reports found</p>
                  <p className="text-sm mt-1 text-muted-foreground">Create a new report or adjust your filters</p>
                  <button
                    onClick={handleNewReport}
                    className="mt-4 px-4 py-2 bg-primary hover:bg-primary/90 rounded-md text-primary-foreground transition-colors"
                  >
                    Create a report
                  </button>
                </div>
              ) : (
                currentReports.map((report) => (
                  <div 
                    key={report.id}
                    onClick={() => handleOpenReport(report.id)}
                    className="bg-background rounded-lg border border-border/40 p-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-start">
                        <FileText className="h-5 w-5 text-primary mr-2 mt-0.5" />
                        <div>
                          <h3 className="font-medium line-clamp-1">{report.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{report.template}</p>
                        </div>
                      </div>
                      {renderStatusBadge(report.status)}
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="truncate">{report.client}</span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                        <span>Updated {getRelativeTime(report.lastUpdated)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                        <span>Created {formatDate(report.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-border/40 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle download action
                        }}
                        className="p-1.5 rounded text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle archive action
                        }}
                        className="p-1.5 rounded text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors ml-1"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle more options
                        }}
                        className="p-1.5 rounded text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors ml-1"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {/* Pagination */}
          {filteredReports.length > reportsPerPage && (
            <div className="py-4 px-4 border-t border-border/40">
              <Pagination>
                <PaginationContent>
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage - 1);
                        }} 
                      />
                    </PaginationItem>
                  )}
                  
                  {/* First page */}
                  {currentPage > 2 && (
                    <PaginationItem>
                      <PaginationLink 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(1);
                        }}
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {/* Ellipsis if needed */}
                  {currentPage > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  {/* Previous page if not first */}
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationLink 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage - 1);
                        }}
                      >
                        {currentPage - 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {/* Current page */}
                  <PaginationItem>
                    <PaginationLink href="#" isActive>
                      {currentPage}
                    </PaginationLink>
                  </PaginationItem>
                  
                  {/* Next page if not last */}
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationLink 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage + 1);
                        }}
                      >
                        {currentPage + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {/* Ellipsis if needed */}
                  {currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  {/* Last page if not current or next */}
                  {currentPage < totalPages - 1 && (
                    <PaginationItem>
                      <PaginationLink 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(totalPages);
                        }}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                  
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage + 1);
                        }} 
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

ReportsPanel.getLayout = (page: React.ReactNode) => {
  return <AppLayout>{page}</AppLayout>;
};
