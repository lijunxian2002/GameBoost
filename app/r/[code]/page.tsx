import CustomerReport from '../../report/page';
import SpiderMan2Report from './spiderman2-report';

export default async function DynamicReportPage({ params }: { params: Promise<{ code: string }> | { code: string } }) {
  const resolved = await Promise.resolve(params);
  return resolved.code.toUpperCase() === 'FB66CC' ? <SpiderMan2Report /> : <CustomerReport />;
}
