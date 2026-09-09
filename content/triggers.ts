/**
 * Trigger definitions and every user-facing string in the app.
 *
 * The design doc is emphatic about this: slang like "toang" and "cạn pin" will
 * age out in 6–12 months, so copy must be refreshable without an app update.
 * The rule this file exists to enforce:
 *
 *   No Vietnamese string literal appears in any component. Ever.
 *
 * Everything below is plain data, which means it can later be served from a CMS
 * or a remote JSON blob with no change to the screens that read it.
 *
 * Structure: 5 triggers, each with its own set of sections, 5 pieces per
 * section. Each section surfaces exactly one piece per day — see `source.ts`.
 */

import type { TintKey } from '../theme/tokens';

export type TriggerId =
  | 'kho-ngu'
  | 'stress'
  | 'that-tinh'
  | 'khoi-dau'
  | 'hang-ngay';

export type ContentType = 'breathing' | 'meditation' | 'story';

/** Icon names from @expo/vector-icons' MaterialCommunityIcons set. */
export type IconName =
  | 'sleep'
  | 'lightning-bolt'
  | 'heart-broken'
  | 'weather-sunset-up'
  | 'weather-partly-cloudy'
  | 'weather-windy'
  | 'meditation'
  | 'book-open-page-variant';

export interface Trigger {
  id: TriggerId;
  /** Slang label shown on the home tile, emoji included. */
  label: string;
  /** One-line context line under the label. */
  subtitle: string;
  tint: TintKey;
  icon: IconName;
  /**
   * Which sections this trigger carries, in display order.
   *
   * Not every trigger gets all three — "Bắt đầu ngày mới" has no story, since
   * nobody is sitting through 25 minutes of fiction on the way out the door.
   */
  sections: ContentType[];
  /**
   * Shown on the playlist screen *above any content*. Acknowledging the feeling
   * before offering anything is the product thesis, not a layout choice.
   */
  intro: { headline: string; body: string };
  /** Small muted line at the bottom of the playlist. */
  closing: string;
}

/**
 * Sections run shortest first within a trigger, so whoever is in the worst
 * shape meets the five-minute option before the twenty-five-minute one.
 */
const ALL_SECTIONS: ContentType[] = ['breathing', 'meditation', 'story'];
const NO_STORY: ContentType[] = ['breathing', 'meditation'];

export const TRIGGERS: Trigger[] = [
  {
    id: 'kho-ngu',
    label: 'Khó ngủ 🌙',
    subtitle: 'Nằm hoài không ngủ được',
    tint: 'violet',
    icon: 'sleep',
    sections: ALL_SECTIONS,
    intro: {
      headline: 'Nằm hoài mà chưa ngủ được ha.',
      body: 'Ép cũng không ngủ được đâu. Cứ nghe cái gì đó, tới lúc thì ngủ.',
    },
    closing: 'Không ngủ được cũng không phải lỗi của bạn',
  },
  {
    id: 'stress',
    label: 'Stress 😵‍💫',
    subtitle: 'Công việc, cuộc sống',
    tint: 'orange',
    icon: 'lightning-bolt',
    sections: ALL_SECTIONS,
    intro: {
      headline: 'Nhiều thứ dồn lại quá ha.',
      body: 'Gỡ hết thì không được. Nhưng đặt xuống một lát thì được.',
    },
    closing: 'Làm được tới đâu hay tới đó',
  },
  {
    id: 'that-tinh',
    label: 'Thất tình 💔',
    subtitle: 'Chia tay, nhớ, buồn',
    tint: 'blue',
    icon: 'heart-broken',
    sections: ALL_SECTIONS,
    intro: {
      headline: 'Ừ thì toang. Nhưng mà ổn thôi.',
      body: 'Đây là mấy cái giúp bạn qua tối nay trước đã, từ từ tính tiếp sau.',
    },
    closing: 'Không có gì đúng hay sai để cảm thấy lúc này cả',
  },
  {
    id: 'khoi-dau',
    label: 'Bắt đầu ngày mới ☀️',
    subtitle: 'Trước khi đi học, đi làm',
    tint: 'aqua',
    icon: 'weather-sunset-up',
    sections: NO_STORY,
    intro: {
      headline: 'Chưa cần vội đâu.',
      body: 'Vài phút cho tỉnh người, rồi ra ngoài kia tính tiếp.',
    },
    closing: 'Ngày còn dài, đi từ từ cũng được',
  },
  {
    id: 'hang-ngay',
    label: 'Hàng ngày 🙂',
    subtitle: 'Nay không có gì đặc biệt',
    tint: 'green',
    icon: 'weather-partly-cloudy',
    sections: ALL_SECTIONS,
    intro: {
      headline: 'Nay cũng bình thường ha.',
      body: 'Không có gì phải xử lý hết. Nghe cho vui, cho đều.',
    },
    closing: 'Không cần lý do mới được ngồi yên',
  },
];

/**
 * Presentation for each section. The icon tint follows the *section*, not the
 * trigger it sits under — so a breathing piece reads as blue whether you
 * reached it from "Thất tình" or "Hàng ngày".
 */
export const CONTENT_TYPES: Record<
  ContentType,
  { label: string; tint: TintKey; icon: IconName }
> = {
  breathing: { label: 'Thở', tint: 'blue', icon: 'weather-windy' },
  meditation: { label: 'Thiền', tint: 'violet', icon: 'meditation' },
  story: { label: 'Truyện', tint: 'orange', icon: 'book-open-page-variant' },
};

/** Everything else the UI says out loud. */
export const COPY = {
  brand: 'yên',

  home: {
    greeting: 'Ê, nay sao rồi?',
    greetingSub: 'Chọn 1 cái thấy đúng vibe nhất',
  },

  /**
   * The journey screen. Every line here is phrased so it can only ever be good
   * news — nothing on this screen is allowed to read as a reprimand.
   */
  journey: {
    /** Shown before there's any history worth summarising. */
    emptyTitle: 'Chưa có gì để xem đâu',
    emptyBody: 'Nghe vài bữa rồi quay lại.',

    /** Headline: total time listened. */
    listenedLabel: 'Bạn đã dành cho mình',
    /** Days the app was used — a total, never a streak that can break. */
    daysLabel: 'ngày có mặt ở đây',
    /** Prefix for the most-used trigger, e.g. "Bạn hay tới đây khi… Khó ngủ". */
    topTriggerLabel: 'Bạn hay tới đây khi',
    /** Shown instead when no single trigger leads yet. */
    noPatternYet: 'Chưa đủ để thấy thói quen gì đâu',
  },
  profile: {
    title: 'Chưa có gì ở đây',
    body: 'Cái này để sau.',
  },

  player: {
    /** Accessibility labels — spoken, never displayed. */
    playA11y: 'Phát',
    pauseA11y: 'Tạm dừng',
    backA11y: 'Quay lại',
    /** The chevron collapses the player rather than stopping it. */
    minimizeA11y: 'Thu nhỏ',
    loading: 'Đang tải...',
  },

  tabs: {
    home: 'Trang chủ',
    /**
     * "Hành trình", not "Thống kê" — the doc's journey-map framing, and it
     * avoids the clinical dashboard register the doc bans.
     */
    journey: 'Hành trình',
    profile: 'Cá nhân',
  },
};

/**
 * "4 tiếng 20 phút" — total time listened.
 *
 * Rounds to whole minutes; under a minute reads as "chưa tới 1 phút" rather
 * than "0 phút", which would look like the app forgot.
 */
export function formatListened(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 1) return 'chưa tới 1 phút';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} phút`;
  if (rest === 0) return `${hours} tiếng`;
  return `${hours} tiếng ${rest} phút`;
}

/** "15 phút" — the only duration shape the UI uses. */
export function formatDuration(seconds: number): string {
  return `${Math.max(1, Math.round(seconds / 60))} phút`;
}

/** "5 ngày" for the streak pill. */
export function formatStreak(days: number): string {
  return `${days} ngày`;
}

/** "Thở · 5 phút" — the subtitle under a content card title. */
export function formatContentMeta(type: ContentType, seconds: number): string {
  return `${CONTENT_TYPES[type].label} · ${formatDuration(seconds)}`;
}

export function getTrigger(id: string): Trigger | undefined {
  return TRIGGERS.find((t) => t.id === id);
}
