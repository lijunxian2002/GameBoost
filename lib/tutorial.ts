import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

/** 支持的教程主题。第一版只有降温清灰完整教程。 */
export const SUPPORTED_TOPICS = ['cooling'] as const;
export type TutorialTopic = (typeof SUPPORTED_TOPICS)[number];

const FONT = 'Microsoft YaHei';

function heading(text: string, level: 0 | 1 | 2 = 1): Paragraph {
  return new Paragraph({
    heading: level === 0 ? HeadingLevel.TITLE : level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, font: FONT })],
  });
}

function body(text: string, opts: { bold?: boolean; color?: string } = {}): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, font: FONT, size: 22, ...opts })],
  });
}

function numbered(no: string, text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 100 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: `${no}　`, font: FONT, size: 22, bold: true }),
      new TextRun({ text, font: FONT, size: 22 }),
    ],
  });
}

function tip(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 80, after: 160 },
    indent: { left: 240 },
    children: [new TextRun({ text: `提示：${text}`, font: FONT, size: 20, color: '7a7a74' })],
  });
}

function toolsTable(rows: string[][], widths: number[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'c9c9c2' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'c9c9c2' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'c9c9c2' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'c9c9c2' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'e0e0da' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'e0e0da' },
    },
    rows: rows.map(
      (cells, ri) =>
        new TableRow({
          tableHeader: ri === 0,
          children: cells.map(
            (cell, ci) =>
              new TableCell({
                width: { size: widths[ci] ?? Math.floor(100 / cells.length), type: WidthType.PERCENTAGE },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: cell, font: FONT, size: 21, bold: ri === 0 })],
                  }),
                ],
              }),
          ),
        }),
    ),
  });
}

function diagram(image: Buffer, width: number, height: number): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 80 },
    children: [
      new ImageRun({
        type: 'png',
        data: image,
        transformation: { width, height },
      }),
    ],
  });
}

function caption(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text, font: FONT, size: 18, color: '8a8a84' })],
  });
}

/**
 * 生成《老电脑降温清灰完整教程》DOCX。
 * images 为 { key, buffer } 列表：back-screws / internal-layout / thermal-paste。
 * 内容基于真实笔记本维护经验（断电放静电、PTM7950 相变片、游戏满载温度范围等）。
 */
export async function buildCoolingTutorial(
  model: string,
  images: Record<string, Buffer>,
): Promise<Buffer> {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: 22 } },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          heading(`老电脑降温清灰完整教程（${model}）`, 0),
          body('适用：使用 2~3 年以上的游戏本，出现待机温度升高、风扇噪音变大、游戏降频变卡的机型。整个教程只做可逆操作，不修改任何硬件参数。', { color: '5a5a54' }),

          heading('一、写在前面'),
          body('本教程分两部分：硬件清灰（拆机维护）与软件降温（系统层面调整）。建议先做软件部分，若温度改善不明显，再做硬件清灰。所有步骤都不需要专业工具，动手前请完整阅读本教程。', ),
          body('安全底线：拆机前必须断电、拔电池排线、放静电；不确定的步骤宁可停下，也不要用力。拆机可能影响保修，动手前请自行确认。', { bold: true }),

          heading('二、准备工具'),
          toolsTable([
            ['工具', '用途', '备注'],
            ['十字螺丝刀（PH00/PH0）', '拆后盖与散热模组螺丝', '磁性头更安全'],
            ['塑料撬棒', '沿后盖边缘撬开卡扣', '不要用金属，防划伤'],
            ['气吹 / 压缩空气罐', '吹风扇叶片与鳍片积灰', '喷口离风扇 5cm 以上'],
            ['软毛刷', '扫除主板表面浮灰', '刷毛要软，避免静电'],
            ['酒精棉片', '擦除旧硅脂', '等挥发后再涂新的'],
            ['导热硅脂或相变硅脂片', '换硅脂（可选步骤）', '推荐相变片，如 PTM7950'],
          ], [16, 44, 40]),

          heading('三、第一步：断电与放电'),
          numbered('1', '关机并拔掉电源适配器，同时拔下所有外接设备（U 盘、鼠标、耳机等）。'),
          numbered('2', '打开后盖后第一步是拔电池排线；如果电池不可拆，先拔排线再继续。'),
          numbered('3', '长按电源键 10~15 秒，放掉主板余电。'),
          numbered('4', '操作前摸一下金属窗框或水管释放人体静电；条件允许时戴防静电手环。'),
          tip('全程不要穿容易起静电的毛衣，也不要在铺地毯的房间操作。'),

          heading('四、第二步：拆后盖并清灰'),
          numbered('1', `翻转笔记本，拧下后盖全部螺丝（${model} 常见 10 颗，部分藏在脚垫下，位置见图 1）。`),
          numbered('2', '用撬棒从后盖边缘一角轻轻撬起，沿四周慢慢打开卡扣，不要蛮力。'),
          numbered('3', '打开后先拔电池排线，再长按电源键放电。'),
          diagram(images['back-screws'] ?? Buffer.alloc(0), 560, 300),
          caption('图 1 · 后盖螺丝位置示意（拧松即可，位置以实物为准）'),
          numbered('4', '用气吹和软毛刷清理风扇叶片、散热鳍片与出风口积灰；鳍片缝隙用气吹斜吹。'),
          numbered('5', '风扇可单独拆下（每颗风扇通常 4 颗小螺丝）后深度清理，装回时对准排线。'),
          numbered('6', '主板与内存、固态表面只扫浮灰，不要用气吹直吹任何排线接口。'),
          diagram(images['internal-layout'] ?? Buffer.alloc(0), 560, 300),
          caption('图 2 · 内部布局示意（先拔电池，再拆散热模组）'),

          heading('五、第三步：更换硅脂（可选，推荐）'),
          body('如果清灰后待机温度仍然偏高（比如 70°C 以上），或机器已使用超过两年，建议更换硅脂。导热硅脂会随时间干涸，导热能力明显下降。'),
          numbered('1', '按螺丝序号（1→6）对角顺序拧松散热模组螺丝，轻轻抬起模组。'),
          numbered('2', '用酒精棉片擦净 CPU、GPU 芯片表面与散热铜座上的旧硅脂，等待挥发。'),
          numbered('3', '涂新硅脂：米粒大小即可，用刮片抹平或十字形涂法（见图 3），宁少勿多。'),
          numbered('4', '使用相变硅脂片（如 PTM7950）时无需涂抹：按芯片尺寸裁剪贴片，撕膜后直接贴上，装上散热模组后第一次满载运行即完成相变。'),
          numbered('5', '装回散热模组，按序号对角、分多次拧紧螺丝，不要一次拧死。'),
          diagram(images['thermal-paste'] ?? Buffer.alloc(0), 560, 300),
          caption('图 3 · 硅脂涂抹示意（十字形，薄而均匀，宁少勿多）'),

          heading('六、第四步：软件层面降温优化'),
          numbered('1', '电源计划：Windows 电源模式选择“最佳性能”，或在电源选项中确保 CPU 最小/最大处理器状态未被压低。'),
          numbered('2', '显卡驱动：保持最新稳定版驱动；在 NVIDIA 控制面板中确认电源管理模式为“最高性能优先”。'),
          numbered('3', '后台清理：关闭开机自启的无关程序，特别是直播伴侣、浏览器常驻标签等占用 CPU 的进程。'),
          numbered('4', '风扇策略：部分机型支持在 BIOS 或拯救者控制台调整风扇模式（如“野兽模式”风扇更激进，适合打游戏）。'),
          numbered('5', '环境辅助：使用笔记本散热垫或在底部垫高，保证进风口通畅；室温 26°C 左右最理想。'),
          numbered('6', '若仍降频明显，可用 GameBoost 采样一次游戏场景，确认温度、频率、功耗的真实数据后再决定是否值得继续投入。'),
          tip('游戏满载 95~100°C 对高性能游戏本属于正常发挥（极限 105°C），不要以“必须 80°C”为目标，稳定不降频才是关键。'),

          heading('七、验收标准'),
          toolsTable([
            ['检查项', '合格标准'],
            ['待机温度', '比维护前下降 5~15°C（常见从 70+°C 回到 55~65°C）'],
            ['游戏满载', '不撞温度墙持续降频，帧率波动明显减小'],
            ['风扇噪音', '满载风扇声变小或不再长时间满转'],
            ['稳定性', '清灰后运行 2 小时游戏或烤机测试无重启、无蓝屏'],
          ], [32, 68]),

          heading('八、注意事项'),
          body('1. 所有螺丝按原位装回，防止长螺丝拧进短孔位损坏主板。'),
          body('2. 清灰后第一次开机若点不亮，先检查电池排线、屏幕排线是否插紧。'),
          body('3. 硅脂更换不当（过多/过少/没贴紧）可能比不换更糟；没把握时只做清灰。'),
          body('4. 笔记本内部没有“定期必须换”的部件，一切以温度与稳定性数据为准。'),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 480 },
            children: [new TextRun({ text: '—— GameBoost × 李俊贤 · 图文教程', font: FONT, size: 18, color: '8a8a84' })],
          }),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}

export async function fetchTutorialImages(baseUrl: string): Promise<Record<string, Buffer>> {
  const entries: Array<[string, string]> = [
    ['back-screws', '/assets/tutorials/back-screws.png'],
    ['internal-layout', '/assets/tutorials/internal-layout.png'],
    ['thermal-paste', '/assets/tutorials/thermal-paste.png'],
  ];
  const out: Record<string, Buffer> = {};
  for (const [key, path] of entries) {
    try {
      const res = await fetch(new URL(path, baseUrl));
      if (res.ok) out[key] = Buffer.from(await res.arrayBuffer());
    } catch {
      // 图片缺失时文档仍可生成（无图版）
    }
  }
  return out;
}
