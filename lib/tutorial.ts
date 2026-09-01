import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  TextRun,
} from 'docx';

/** 与 Agent 的文档触发标记保持兼容。 */
export const SUPPORTED_TOPICS = ['cooling'] as const;

const FONT = 'Microsoft YaHei';
const INK = '0B2545';
const MUTED = '59636D';
const BLUE = '2E74B5';

function paragraph(text: string, style = 'GBBody'): Paragraph {
  return new Paragraph({ style, children: [new TextRun({ text, font: FONT })] });
}

function checklist(text: string): Paragraph {
  return new Paragraph({
    style: 'GBBody',
    numbering: { reference: 'safe-checklist', level: 0 },
    children: [new TextRun({ text, font: FONT })],
  });
}

function warning(text: string): Paragraph {
  return new Paragraph({
    style: 'GBCallout',
    shading: { type: ShadingType.CLEAR, color: 'FFF4E5', fill: 'FFF4E5' },
    border: {
      left: { style: BorderStyle.SINGLE, color: 'C87912', size: 16, space: 120 },
    },
    children: [new TextRun({ text, font: FONT, bold: true, color: '7A4A00' })],
  });
}

/**
 * 客户可直接阅读的散热维护安全清单。
 * 不替任何具体机型下拆机指令、温度红线或功耗方案；具体动作必须由采样和人工判断支持。
 */
export async function buildCoolingTutorial(model: string): Promise<Buffer> {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: FONT, size: 22, color: INK } },
      },
      paragraphStyles: [
        {
          id: 'GBTitle',
          name: 'GBTitle',
          basedOn: 'Normal',
          next: 'GBBody',
          run: { font: FONT, size: 36, bold: true, color: INK },
          paragraph: { spacing: { before: 0, after: 100, line: 300 } },
        },
        {
          id: 'GBMeta',
          name: 'GBMeta',
          basedOn: 'Normal',
          next: 'GBBody',
          run: { font: FONT, size: 18, color: MUTED },
          paragraph: { spacing: { before: 0, after: 280, line: 280 } },
        },
        {
          id: 'GBBody',
          name: 'GBBody',
          basedOn: 'Normal',
          next: 'GBBody',
          run: { font: FONT, size: 22, color: INK },
          paragraph: { spacing: { before: 0, after: 120, line: 300 } },
        },
        {
          id: 'GBCallout',
          name: 'GBCallout',
          basedOn: 'Normal',
          next: 'GBBody',
          run: { font: FONT, size: 21, color: '7A4A00' },
          paragraph: { spacing: { before: 100, after: 180, line: 300 }, indent: { left: 180, right: 120 } },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'safe-checklist',
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 540, hanging: 270 }, spacing: { after: 80, line: 300 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          new Paragraph({ style: 'GBTitle', children: [new TextRun({ text: 'GameBoost 散热维护安全清单', font: FONT })] }),
          new Paragraph({
            style: 'GBMeta',
            children: [new TextRun({ text: `机型：${model}　·　用于采样后的维护判断，不替代该机型官方服务手册`, font: FONT })],
          }),

          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '先说结论', font: FONT, color: BLUE })] }),
          paragraph('游戏本发热、风扇变吵、帧时间变差，可能来自环境、后台、帧率目标、散热积灰、硅脂或硬件功耗边界。没有某一个“万能温度”或“万能性能模式”适合所有机器；先采样，再决定是软件调整、维护还是送修。'),
          warning('如果出现异味、冒烟、外壳异常烫手、鼓包、频繁自动关机或充电异常：立刻停止使用和充电，不要继续跑游戏或拆机，优先联系官方售后或专业维修。'),

          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '你可以先安全完成的 6 件事', font: FONT, color: BLUE })] }),
          checklist('插电、保持平时的性能模式和游戏画质，先用 GameBoost 采一局真实场景；不要为了“好看数据”临时开启极限性能或关闭常用后台。'),
          checklist('让笔记本底部进风口悬空并保持出风口通畅；不要放在被子、腿上或软垫上。室温较高时，温度与噪音上升是正常现象。'),
          checklist('只清理机身外部和出风口可见灰尘，使用柔软毛刷或低压气吹，并固定风扇叶片避免被高速反吹。不要把液体、金属工具伸进机身。'),
          checklist('把游戏帧率上限设在机器能长期稳定维持的数值，而不是无上限追求瞬时高帧；帧率稳定通常比峰值更利于温度、噪音和操作感。'),
          checklist('优先使用品牌控制中心的“平衡 / 自动”风扇策略观察数据。高性能模式会提高功耗和热量，只有采样显示散热仍有余量、且确有帧率需求时才考虑。'),
          checklist('记录问题发生的游戏场景、是否外接屏、分辨率与刷新率、插电状态和性能模式；这比单报一个温度更能解释“卡在哪里”。'),

          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '哪些情况不要自己拆机', font: FONT, color: BLUE })] }),
          checklist('还在保修期内，或你从未拆过笔记本。拆机、拆散热模组、换硅脂都可能影响保修，也存在损坏排线、螺丝孔和导热垫的风险。'),
          checklist('需要拔电池、拆风扇、拆散热器、换硅脂或导热垫时。不同机型内部结构、螺丝长度、导热垫厚度都不同，必须以该机型官方手册或专业维修人员判断为准。'),
          checklist('采样显示高温与频率明显下落、或游戏后期越来越卡，但你无法确认是 CPU、GPU、供电还是内存瓶颈时。先把 .gbsample 发回，让结论基于证据。'),

          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '怎么看采样，而不是死盯温度', font: FONT, color: BLUE })] }),
          paragraph('重点看同一时间段是否同时出现：帧时间尖峰、CPU/GPU 频率持续下落、功耗被压低、温度持续攀升，或显存/内存接近上限。只有这些指标关联起来，才能区分温度墙、功耗墙、显存不足、CPU 限制或游戏自身卡顿。'),
          paragraph('任何温度数字都要结合 CPU/GPU 型号、传感器位置、持续时间和是否降频判断。看到单次峰值不等于故障；看到持续异常并伴随性能下降，才是应该维护或送修的信号。'),

          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '发回案例时请附上', font: FONT, color: BLUE })] }),
          checklist('.gbsample 文件，以及游戏名称、出现卡顿的具体场景。'),
          checklist('是否外接屏、外接屏分辨率与刷新率；笔记本是否插电、使用什么性能模式。'),
          checklist('你最在意的是稳定帧时间、画质、低噪音、低温，还是续航。优化目标不同，方案也不同。'),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 420, after: 0 },
            children: [new TextRun({ text: 'GameBoost × 李俊贤 · 让优化建立在证据上', font: FONT, size: 18, color: MUTED })],
          }),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}
