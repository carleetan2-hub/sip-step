export interface Exercise {
  id: string;
  name: string;
  duration: number; // in seconds
  description: string;
  benefit: string;
  category: 'neck' | 'shoulder' | 'chest' | 'back' | 'wrist' | 'legs';
  steps: string[];
}

export interface HealthTip {
  id: string;
  category: 'posture' | 'eyes' | 'hydration' | 'habits';
  title: string;
  content: string;
}

export interface TodayStats {
  completedCount: number;
  totalActiveMinutes: number;
  lastCompletedTime: string | null;
  hydrationGlassCount: number;
}

export const EXERCISES: Exercise[] = [
  {
    id: 'neck_stretch',
    name: '颈部画圆拉伸',
    duration: 20,
    description: '缓解长时间低头盯屏幕造成的颈椎酸痛，拉伸颈部两侧肌肉。',
    benefit: '放松斜方肌，改善脑部血液循环。',
    category: 'neck',
    steps: [
      '端坐或站立，放松肩膀。',
      '慢慢将右耳贴向右肩，感受左侧颈部的拉伸，保持5秒。',
      '缓缓将下巴沉向胸口，画半圆到左侧，让左耳贴向左肩，保持5秒。',
      '全程动作请保持缓慢平稳，配合深呼吸。'
    ]
  },
  {
    id: 'shoulder_squeeze',
    name: '肩胛骨后收挤压',
    duration: 15,
    description: '纠正因操作鼠标键盘导致的“含胸驼背”姿态，打开胸腔。',
    benefit: '激活中下斜方肌，改善圆肩体态。',
    category: 'shoulder',
    steps: [
      '端坐或站立，双臂曲肘置于身侧，手心向上或向前。',
      '用力将双侧肩膀向后、向下沉，感受两片肩胛骨拼命靠拢。',
      '想象在两片肩胛骨中间夹了一支铅笔，保持发力5-10秒。',
      '重复2-3次，拉伸时呼气，放松时吸气。'
    ]
  },
  {
    id: 'chest_opener',
    name: '双手开胸拉伸',
    duration: 20,
    description: '舒展因久坐而紧缩的前侧胸大肌。',
    benefit: '增加肺活量，改善呼吸深度，舒缓久坐憋闷。',
    category: 'chest',
    steps: [
      '双手在身后的臀部上方十指相扣。',
      '吸气时，挺胸向前，同时双臂伸直并尝试向后、向上抬起。',
      '仰起头将下巴微抬，平缓呼吸，感受胸口被撑开的舒适感。',
      '保持拉伸，不要憋气。'
    ]
  },
  {
    id: 'spinal_twist',
    name: '座椅脊椎转体',
    duration: 30,
    description: '活动略显僵硬的胸椎与腰部腰肌。',
    benefit: '释放椎骨压力，放松下背部。',
    category: 'back',
    steps: [
      '双脚平放在地面上，在大脑一侧轻轻坐正。',
      '将左手放在右膝外侧，右手握住椅背或右侧扶手。',
      '深吸气顶天立地，呼气时，以脊柱为轴缓缓向右后方转体。',
      '转到舒适的极限后，保持深长呼吸15秒，然后换另一侧。'
    ]
  },
  {
    id: 'wrist_stretch',
    name: '反向腕部拉伸',
    duration: 15,
    description: '预防和松解因长时间打字、打游戏造成的键盘手与鼠标手。',
    benefit: '缓解前臂近侧屈肌腱张力，增加腕关节灵活度。',
    category: 'wrist',
    steps: [
      '向前伸出右手臂，手肘伸直，手掌立起，掌心向前（像一堵墙）。',
      '用左手轻轻往回扳动右手四指，感受右前臂内侧的酸胀拉伸，保持10秒。',
      '接着将右手掌心朝内、指尖向下，左手从外侧压住手背拉伸外侧，保持10秒。',
      '换另一侧手，重复以上动作。'
    ]
  },
  {
    id: 'calf_raises',
    name: '站立提踵泵血',
    duration: 20,
    description: '刺激腿部“第二心脏”血液回流，防止久坐引起的水肿和静脉曲张。',
    benefit: '增强小腿肌群力量，促进下肢静脉回流。',
    category: 'legs',
    steps: [
      '稳稳站立，双脚与肩同宽。如果重心不稳，可扶住电竞椅。',
      '呼气时，缓缓将双脚后跟抬起，仅用脚尖支撑身体，膝盖微绷直。',
      '在最高点微停1秒，感受小腿肌肉彻底收缩。',
      '吸气时，控制着慢慢下放脚后跟。重复进行15-20次。'
    ]
  }
];

export const HEALTH_TIPS: HealthTip[] = [
  {
    id: 'tip_1',
    category: 'eyes',
    title: '20-20-20 用眼法则',
    content: '每盯着屏幕看 20 分钟，就把视线转开，望向至少 20 英尺（约 6 米）远的风景或物体，保持 20 秒以上。这能让眼部睫状肌得到有效放松，有效预防视疲劳。'
  },
  {
    id: 'tip_2',
    category: 'posture',
    title: '正确坐姿指南',
    content: '大腿与躯干保持 90-100 度夹角；双脚平放于地面，避免翘二郎腿；屏幕上边缘与眼睛齐平或略低，避免长时间低头给颈椎带来 4-5 倍的负重压力。'
  },
  {
    id: 'tip_3',
    category: 'hydration',
    title: '起立喝水契机',
    content: '喝水不仅是为了补充水分，更是天然的起立借口。可以把水杯容量换小一点（比如 250ml），这样你每小时就必须起立去接一趟水。一举两得！'
  },
  {
    id: 'tip_4',
    category: 'habits',
    title: '微习惯的力量',
    content: '不要等到浑身酸痛才开始休息。每 45-60 分钟活动 2-3 分钟，其恢复精力的效果，远远大于连续工作 3 小时然后躺尸半天。让身体时刻处于良性循环。'
  },
  {
    id: 'tip_5',
    category: 'eyes',
    title: '保持眨眼频率',
    content: '盯着屏幕看时，我们的眨眼次数会从平常的每分钟 15 次骤降至 5 次左右。这会导致泪膜蒸发，引起干眼症。请在电脑旁摆放绿植，提醒自己多主动眨眼。'
  },
  {
    id: 'tip_6',
    category: 'posture',
    title: '肩膀下沉意识',
    content: '工作累了时，人会不由自主地耸肩，这会让颈肩部的斜方肌长期处于紧绷僵硬状态。尝试深呼吸，将双肩用力向下沉，吐出浊气。让肩膀远离耳朵！'
  }
];
