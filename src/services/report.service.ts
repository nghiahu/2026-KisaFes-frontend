import axiosClient from './axiosClient';

export interface BurndownChartData {
  labels: string[];
  planned: number[];
  actual: number[];
}

export interface WorkDistributionData {
  teamName: string;
  count: number;
  percentage: number;
}

export interface GlobalReportResponse {
  burndownChart: BurndownChartData;
  workDistribution: WorkDistributionData[];
}

export const reportService = {
  getGlobalReport: async (days: number = 30, projectId?: string): Promise<GlobalReportResponse> => {
    const params = new URLSearchParams();
    params.append('days', days.toString());
    if (projectId && projectId !== 'all') {
      params.append('projectId', projectId);
    }
    const response = await axiosClient.get(`/reports/global?${params.toString()}`);
    // Assuming ResponseWrapper structure: { code: 200, message: "...", data: GlobalReportResponse }
    return response.data;
  },
};
