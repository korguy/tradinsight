"use client"

import * as React from "react"

import { ChevronUp, ChevronDown, TrendingUp, TrendingDown } from "lucide-react"
import { Pie, PieChart } from "recharts"
import { createClient } from '@supabase/supabase-js'
import Markdown from 'react-markdown'

import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { StrategySidebar } from "@/components/sidebar";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const chartConfig = {
  cryptocurrency: {
    label: "Cryptocurrency",
  },
  balance: {
    label: "Balance",
  },
} satisfies ChartConfig


const formatTimestamp = (timestamp: string) => {
  if (!timestamp) return "";
  
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(timestamp)).replace(',', '');
};

export default function Home() {
  const [strategyData, setStrategyData] = React.useState<any[]>([])
  const [targets, setTargets] = React.useState<any[]>([])
  const [selectedStrategy, setSelectedStrategy] = React.useState<string>()
  const [selectedCrypto, setSelectedCrypto] = React.useState<string>("BTC");
  const [loading, setLoading] = React.useState(false);
  const [technicalAnalysis, setTechnicalAnalysis] = React.useState<any>(null);
  const [sentimentalAnalysis, setSentimentalAnalysis] = React.useState<any>(null);
  const [technicalLoading, setTechnicalLoading] = React.useState(false);
  const [sentimentalLoading, setSentimentalLoading] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState<string>("");
  const [decisions, setDecisions] = React.useState<any[]>([]);

  // Update the interface for portfolio items
  interface PortfolioItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }

  const [portfolio, setPortfolio] = React.useState<PortfolioItem[]>([]);
  const [portfolioLoading, setPortfolioLoading] = React.useState(false);
  

  React.useEffect(() => {
    async function fetchStrategy() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('strategy')
          .select('*')
        
        if (error) {
          console.error('Error fetching strategy data:', error)
        } else {
          setStrategyData(data)
          setSelectedStrategy(data[0].name)
        }
      } catch (error) {
        console.error('Unexpected error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchStrategy()
  }, [])

  React.useEffect(() => {
    const targetsString = strategyData.find(strategy => strategy.name === selectedStrategy)?.targets;
    if (targetsString) {
      try {
        // Parse the string that looks like "['BTC','XRP','SOL','XRP']" into an actual array
        const targetsArray = JSON.parse(targetsString.replace(/'/g, '"'));
        setTargets(targetsArray);
      } catch (error) {
        setTargets([]);
      }
    }
  }, [strategyData, selectedStrategy])

  async function fetchLatestData(type: string) {
    try {
      const { data, error } = await supabase
        .from('analysis')
        .select('*')
        .eq('name', selectedStrategy || '')
        .eq('type', type)
        .eq('target', `${selectedCrypto}USDT`)
        .order('created', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error(`Error fetching ${type} data:`, error);
        return null;
      }
      
      // Only update lastUpdate if we actually got data
      if (data && data.length > 0) {
        // Validate that the content field exists
        if (!data[0].content) {
          console.warn(`${type} analysis found but content field is missing or empty`);
        }
        
        if (type === 'technical' || type === 'sentimental') {
          setLastUpdate(data[0]?.created || "");
        }
        return data[0];
      }
      return null;
    } catch (error) {
      console.error(`Unexpected error fetching ${type} data:`, error);
      return null;
    }
  }

  React.useEffect(() => {
    async function fetchDecisions() {
      try {
        const { data, error } = await supabase
        .from('decision')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching decisions:', error);
      } else {
        setDecisions(data);
      }
    } catch (error) {
      console.error('Error fetching decisions:', error);
    }
  }

  fetchDecisions();
  }, []);

  React.useEffect(() => {
    console.log(decisions);
  }, [decisions]);
  
  React.useEffect(()=> {
    async function fetchTechnicalAnalysis() {
      if (!selectedStrategy || !selectedCrypto) return;
      
      setTechnicalLoading(true);
      try {
        const technicalData = await fetchLatestData('technical');
        
        // Detailed logging to help diagnose issues
        console.log(`Technical data for ${selectedCrypto}:`, technicalData);
        if (technicalData) {
          console.log(`Technical content exists: ${Boolean(technicalData.content)}`);
          if (technicalData.content) {
            console.log(`Technical content length: ${technicalData.content.length}`);
          }
        }
        
        // Update technical analysis state
        setTechnicalAnalysis(technicalData);
      } catch (error) {
        console.error('Error fetching technical analysis data:', error);
      } finally {
        setTechnicalLoading(false);
      }
    }
    
    fetchTechnicalAnalysis();
  }, [selectedCrypto, selectedStrategy]);
  
  React.useEffect(()=> {
    async function fetchSentimentalAnalysis() {
      if (!selectedStrategy || !selectedCrypto) return;
      
      setSentimentalLoading(true);
      try {
        const sentimentalData = await fetchLatestData('sentimental');
        
        console.log(`Sentimental data for ${selectedCrypto}:`, sentimentalData);
        
        // Update sentimental analysis state
        setSentimentalAnalysis(sentimentalData);
      } catch (error) {
        console.error('Error fetching sentimental analysis data:', error);
      } finally {
        setSentimentalLoading(false);
      }
    }
    
    fetchSentimentalAnalysis();
  }, [selectedCrypto, selectedStrategy]);

  React.useEffect(() => {
    async function fetchPortfolio() {
      if (!targets.length) return;
      try {
        setPortfolioLoading(true);
        const { data, error } = await supabase
          .from('portfolio')
          .select('*');
        
        if (data) {
          setPortfolio(data);
        }
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      } finally {
        setPortfolioLoading(false);
      }
    }
    
    fetchPortfolio();
  }, [targets]);

  const portfolioChartData = React.useMemo(() => {
    if (!portfolio || portfolio.length === 0) {
      return []; // Use placeholder data if portfolio is empty
    }
    
    // Define colors for each asset
    const colors = {
      BTC: "var(--chart-1)",
      USDT: "var(--chart-2)",
      XRP: "var(--chart-3)",
      SOL: "var(--chart-4)",
      ETH: "var(--chart-5)",
      // Add more as needed
    };
    
    // Transform portfolio items to chart format
    return portfolio
      .filter(item => item.quantity > 0)
      .map((item, index) => ({
        cryptocurrency: item.name,
        balance: (item.quantity * item.price) < 1 ? 0 : item.quantity * item.price, // Calculate USD value, set to 0 if less than $1
        fill: colors[item.name as keyof typeof colors] || `var(--chart-${(index % 5) + 1})` 
      }));
  }, [portfolio]);

  return (
    <SidebarProvider>
      <StrategySidebar selectedStrategy={selectedStrategy || ''} onStrategyChange={setSelectedStrategy} strategies={strategyData} />
      <SidebarInset>
      <header className="flex h-14 items-center border-b px-6">
        <SidebarTrigger />
        <span className="ml-2 text-lg font-semibold">{strategyData.find(strategy => strategy.name === selectedStrategy)?.name} Strategy</span>
        <div className="flex items-end font-mono">
          {/* <span className="pl-3 text-sm text-green-500"><ChevronUp className="inline-block size-4" />0%</span>
          <span className="px-1 text-muted-foreground text-sm">/</span>
          <span className="text-sm text-red-500"><ChevronDown className="inline-block size-4" />0%</span> */}
        </div>
      </header>
      <div className="p-6 space-y-6 h-screen">
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Strategy Overview</CardTitle>
            </CardHeader>
            <CardContent className="md:h-full overflow-y-auto">
              <p>{strategyData.find(strategy => strategy.name === selectedStrategy)?.description}</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Portfolio</CardTitle>
              <CardDescription>{new Date().toLocaleDateString('en-CA')}</CardDescription>
            </CardHeader>
            <CardContent className="md:h-full">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[250px] pb-0 [&_.recharts-pie-label-text]:fill-foreground"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie 
                  data={portfolioChartData} 
                  dataKey="balance" 
                  label 
                  nameKey="cryptocurrency" 
                />
              </PieChart>
            </ChartContainer>
            {!portfolioLoading && portfolio.length > 0 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-xl font-bold">
                  ${portfolio.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)}
                </p>
              </div>
            )}
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 font-medium leading-none">
                {portfolioLoading ? (
                  "Loading portfolio data..."
                ) : (
                  <>
                    Asset Distribution <span className="text-xs text-muted-foreground ml-1">(by USD value)</span>
                  </>
                )}
              </div>
              {/* <div className="leading-none text-muted-foreground">
                Showing total visitors for the last 6 months
              </div> */}
            </CardFooter>
          </Card>
          <Card className="md:col-span-2 md:h-full">
            <CardHeader>
              <div className="flex justify-between">
                <div>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>{formatTimestamp(lastUpdate)}</CardDescription>
                </div>
                <div className="flex items-center">
                  <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Cryptocurrency" />
                    </SelectTrigger>
                    <SelectContent>
                      {targets.map((target, index) => (
                        <SelectItem key={index} value={target}>{target}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label className="font-semibold tracking-tight">Technical Analysis</Label>
                  <div className="text-xs overflow-y-auto md:h-80">
                    {technicalLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <p>Loading technical analysis...</p>
                      </div>
                    ) : technicalAnalysis ? (
                      <>
                        {technicalAnalysis.content ? (
                          <Markdown disallowedElements={['code']}>
                            {technicalAnalysis.content}
                          </Markdown>
                        ) : (
                          <div className="flex justify-center items-center h-full text-muted-foreground">
                            <p>Technical analysis found but no content available</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex justify-center items-center h-full text-muted-foreground">
                        <p>No technical analysis available for {selectedCrypto}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                <Label className="font-semibold tracking-tight">Sentimental Analysis</Label>
                  <div className="text-xs overflow-y-auto md:h-80">
                    {sentimentalLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <p>Loading sentimental analysis...</p>
                      </div>
                    ) : sentimentalAnalysis ? (
                      <>
                        {sentimentalAnalysis.content ? (
                          <Markdown disallowedElements={['code']}>
                            {sentimentalAnalysis.content}
                          </Markdown>
                        ) : (
                          <div className="flex justify-center items-center h-full text-muted-foreground">
                            <p>Sentimental analysis found but no content available</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex justify-center items-center h-full text-muted-foreground">
                        <p>No sentimental analysis available for {selectedCrypto}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Decisions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="md:h-40 overflow-y-auto border rounded">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decisions.map((decision, index) => (
                  <TableRow key={index}>
                    <TableCell>{decision.created_at}</TableCell>
                    <TableCell>{decision.target}</TableCell>
                    <TableCell>{decision.decision}</TableCell>
                    <TableCell>{decision.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </div>
    </SidebarInset>
  </SidebarProvider>
  );
}
