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
  const [analysis, setAnalysis] = React.useState<any[]>([])
  const [lastUpdate, setLastUpdate] = React.useState<string>("")

  const [portfolio, setPortfolio] = React.useState<Record<string, number>>({});
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
        console.error('Error fetching data:', error);
        return null;
      }
      setLastUpdate(data[0]?.created || "");
      // Return the first (latest) record or null if no records found
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Unexpected error:', error);
      return null;
    }
  }
  React.useEffect(()=> {
    async function fetchData() {
      const technicalData = await fetchLatestData('technical');
      const sentimentalData = await fetchLatestData('sentimental');
      setAnalysis([technicalData, sentimentalData]);
    }
    
    fetchData();
  }, [selectedCrypto, selectedStrategy])

  React.useEffect(() => {
    async function fetchPortfolio() {
      if (!targets.length) return;
      try {
        setPortfolioLoading(true);
        const symbolsParam = targets.join(',');
        
        // Fetch portfolio balances
        const portfolioResponse = await fetch(`/api/portfolio?symbols=${symbolsParam}`);
        if (!portfolioResponse.ok) {
          throw new Error('Failed to fetch portfolio');
        }
        const portfolioData = await portfolioResponse.json();
        
        // Fetch current prices
        const pricesResponse = await fetch(`/api/prices?symbols=${symbolsParam}`);
        if (!pricesResponse.ok) {
          throw new Error('Failed to fetch prices');
        }
        const pricesData = await pricesResponse.json();
        
        // Calculate USD value of each asset and filter out values less than $1
        const portfolioWithValues: Record<string, number> = {};
        
        Object.entries(portfolioData.portfolio).forEach(([asset, balance]) => {
          const price = asset === 'USDT' ? 1 : pricesData.prices[asset] || 0;
          const usdValue = (balance as number) * price;
          
          // Only include assets with value >= $1
          if (usdValue >= 1) {
            portfolioWithValues[asset] = usdValue;
          }
        });
        
        setPortfolio(portfolioWithValues);
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      } finally {
        setPortfolioLoading(false);
      }
    }
    
    fetchPortfolio();
  }, [targets]);

  const portfolioChartData = React.useMemo(() => {
    if (!portfolio || Object.keys(portfolio).length === 0) {
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
    
    // Filter out zero balances and transform to chart format
    return Object.entries(portfolio)
      .filter(([_, value]) => value > 0)
      .map(([asset, balance], index) => ({
        cryptocurrency: asset, // Using 'browser' as the key since that's what your chart expects
        balance: balance, // Using 'visitors' as the value key
        fill: colors[asset as keyof typeof colors] || `var(--chart-${(index % 5) + 1})` 
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
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 font-medium leading-none">
                Trending up by - this month <TrendingUp className="h-4 w-4" />
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
                    <Markdown disallowedElements={["code"]}>{analysis[0]?.content}</Markdown>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                <Label className="font-semibold tracking-tight">Sentimental Analysis</Label>
                  <div className="text-xs overflow-y-auto md:h-80">
                    <Markdown disallowedElements={["code"]}>{analysis[1]?.content}</Markdown>
                  </div>
                </div>
              </div>
              {/* <div className="mt-4">
                <Label className="font-semibold tracking-tight">Logs</Label>
                <div className="md:h-40 overflow-y-auto border rounded">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Take Profit</TableHead>
                        <TableHead>Stop Loss</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports[0].logs.map((log, index) => (
                        <TableRow key={index}>
                          <TableCell>{log.date}</TableCell>
                          <TableCell>{log.type}</TableCell>
                          <TableCell>{log.price}</TableCell>
                          <TableCell>{log.takeProfit}</TableCell>
                          <TableCell>{log.stopLoss}</TableCell>
                          <TableCell>{log.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div> */}
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
  );
}
