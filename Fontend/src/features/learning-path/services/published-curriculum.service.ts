import { httpClient } from '../../../core/api/client/http-client';
import { findLessonMetadata, type CurriculumLesson } from '../../learning/data/curriculumData';

export interface CurriculumTopicData {
  id: string | number;
  unitNumber: number;
  hskLevel: number;
  title: string;
  hanziTitle: string;
  pinyinTitle: string;
  lessons: CurriculumLesson[];
}

interface PublishedCourse {
  id: string;
  title: string;
}

interface PublishedUnit {
  id: string;
  unitNumber: number;
  titleVi: string;
  titleZh: string;
}

interface PublishedLesson {
  id: string;
  unitId: string | null;
  lessonNumber: number;
  titleZh: string;
  titleVi: string;
  pinyin?: string;
  summary?: string;
  durationMinutes: number;
  xpReward: number;
}

interface PublishedLessonPage {
  items: PublishedLesson[];
  totalPages: number;
}

export async function getPublishedCurriculum(hskLevel: number, signal?: AbortSignal): Promise<CurriculumTopicData[]> {
  const courses = await httpClient.get<PublishedCourse[]>('/content/courses', {
    params: { hskLevel, status: 'PUBLISHED' },
    signal,
  });
  const courseTopics = await Promise.all(courses.map(async (course) => {
    const params = { courseId: course.id, status: 'PUBLISHED' };
    const getLessonPage = (page: number) => httpClient.get<PublishedLessonPage>('/content/lessons', {
      params: { ...params, page, pageSize: 100 },
      signal,
    });
    const [units, firstPage] = await Promise.all([
      httpClient.get<PublishedUnit[]>('/content/units', { params, signal }),
      getLessonPage(1),
    ]);
    const remainingPages = await Promise.all(
      Array.from({ length: Math.max(0, firstPage.totalPages - 1) }, (_, index) => getLessonPage(index + 2))
    );
    const unitsById = new Map(units.map((unit) => [unit.id, unit]));
    const lessonsByUnit = new Map<string | null, CurriculumLesson[]>();
    for (const lesson of [firstPage, ...remainingPages].flatMap((page) => page.items)) {
      const unit = lesson.unitId ? unitsById.get(lesson.unitId) : undefined;
      if (lesson.unitId && !unit) continue;

      const meta = findLessonMetadata(lesson.id);
      const mapped: CurriculumLesson = {
        id: meta?.id || lesson.id,
        dbId: lesson.id,
        lessonNumber: lesson.lessonNumber,
        hskLevel,
        unitNumber: unit?.unitNumber ?? 1,
        hanzi: lesson.titleZh,
        pinyin: lesson.pinyin ?? '',
        meaning: lesson.titleVi,
        summary: lesson.summary ?? '',
        durationMinutes: lesson.durationMinutes,
        xpReward: lesson.xpReward,
        grammarPointIds: meta?.grammarPointIds ?? [],
        vocabularyIds: meta?.vocabularyIds ?? [],
      };
      const key = unit?.id ?? null;
      const group = lessonsByUnit.get(key) ?? [];
      group.push(mapped);
      lessonsByUnit.set(key, group);
    }

    return [...units, null].flatMap((unit): CurriculumTopicData[] => {
      const lessons = lessonsByUnit.get(unit?.id ?? null);
      if (!lessons?.length) return [];
      return [{
        id: unit?.id ?? course.id,
        unitNumber: unit?.unitNumber ?? 1,
        hskLevel,
        title: unit ? unit.titleVi || unit.titleZh : course.title,
        hanziTitle: unit?.titleZh ?? '',
        pinyinTitle: '',
        lessons,
      }];
    });
  }));
  return courseTopics.flat();
}
