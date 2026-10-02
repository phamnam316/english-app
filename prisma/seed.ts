/**
 * Dữ liệu mẫu: các khóa học + tài khoản demo.
 * Chạy: npm run db:seed
 *
 * Khóa học chưa có (theo tên) thì tạo mới. Khóa đã có thì đồng bộ theo thứ tự chương/bài: bài nào đổi nội dung
 * thì thay từ vựng + bài tập của bài đó. ID bài học giữ nguyên nên tiến độ và XP của người học không bị ảnh hưởng.
 * Không bao giờ xóa chương/bài đang có trong DB.
 */
import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { A1_A2_30_DAYS } from "./data/a1-a2-30-days";
import { fill, mc, type SeedCourse, type SeedLesson } from "./data/types";
import { cefrOf, VOCAB_A1, VOCAB_A2 } from "./data/vocab-courses";

const prisma = new PrismaClient();

const INTERMEDIATE_GRAMMAR: SeedCourse = {
  title: "Ngữ pháp trung cấp",
  description: "Các thì hoàn thành, câu điều kiện và câu bị động qua ví dụ thực tế.",
  level: "INTERMEDIATE",
  isPublished: true,
  units: [
    {
      title: "Thì hiện tại hoàn thành",
      lessons: [
        {
          title: "Present Perfect: cách dùng",
          xp: 15,
          grammar: {
            title: "Thì hiện tại hoàn thành",
            intro:
              "Dùng cho việc **đã xảy ra nhưng còn liên quan đến hiện tại**: kinh nghiệm, việc vừa xong, việc kéo dài đến bây giờ.",
            patterns: [
              "S + **have / has** + V3 (quá khứ phân từ)",
              "**since** + mốc thời gian · **for** + khoảng thời gian",
              "**already** (rồi) trong câu khẳng định · **yet** (chưa) cuối câu hỏi, câu phủ định",
            ],
            examples: [
              { en: "She has lived here since 2020.", vi: "Cô ấy sống ở đây từ năm 2020." },
              { en: "I have already finished my homework.", vi: "Tôi đã làm xong bài tập về nhà rồi." },
              { en: "Have you eaten yet?", vi: "Bạn đã ăn chưa?" },
            ],
            avoid: { wrong: "I have seen this film yesterday.", fix: "Có mốc quá khứ (yesterday) thì dùng quá khứ đơn: I saw this film yesterday." },
          },
          vocab: [
            {
              word: "already",
              phonetic: "/ɔːlˈredi/",
              meaning: "đã (rồi)",
              example: "I have already finished my homework.",
              exampleVi: "Tôi đã làm xong bài tập về nhà rồi.",
            },
            {
              word: "yet",
              phonetic: "/jet/",
              meaning: "chưa (câu phủ định/nghi vấn)",
              example: "Have you eaten yet?",
              exampleVi: "Bạn đã ăn chưa?",
            },
            {
              word: "since",
              phonetic: "/sɪns/",
              meaning: "kể từ",
              example: "She has lived here since 2020.",
              exampleVi: "Cô ấy sống ở đây từ năm 2020.",
            },
          ],
          exercises: [
            mc(
              "She ___ in Hanoi since 2019.",
              ["has lived", "lives", "lived", "is living"],
              "\"since + mốc thời gian\" dùng thì hiện tại hoàn thành.",
            ),
            mc(
              "Have you finished your report ___?",
              ["yet", "already", "since", "for"],
              "\"yet\" đứng cuối câu hỏi và câu phủ định.",
            ),
            fill("Chia động từ: \"I have ___ (see) this film twice.\"", "seen"),
          ],
        },
      ],
    },
  ],
};

const ACADEMIC_ENGLISH: SeedCourse = {
  title: "Tiếng Anh học thuật",
  description: "Viết luận và thuyết trình học thuật (đang biên soạn).",
  level: "ADVANCED",
  isPublished: false,
  units: [],
};

/** Thứ tự hiển thị trên trang chủ */
const COURSES: SeedCourse[] = [A1_A2_30_DAYS, VOCAB_A1, VOCAB_A2, INTERMEDIATE_GRAMMAR, ACADEMIC_ENGLISH];

/** Tài khoản có sẵn (mật khẩu chung bên dưới) */
const SEED_USERS = [
  { email: "demo@example.com", name: "Nguyễn Văn Demo" },
  { email: "usera@example.com", name: "User A" },
  { email: "userb@example.com", name: "User B" },
  { email: "userc@example.com", name: "User C" },
];
const SEED_PASSWORD = "123456";

/** JSON.stringify với khóa được sắp xếp: Postgres (jsonb) không giữ thứ tự khóa của object */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

function vocabRows(lesson: SeedLesson) {
  return lesson.vocab.map((v, i) => ({
    word: v.word,
    phonetic: v.phonetic ?? null,
    meaning: v.meaning,
    exampleSentence: v.example ?? null,
    exampleTranslation: v.exampleVi ?? null,
    cefr: v.cefr ?? cefrOf(v.word),
    order: i,
  }));
}

function exerciseRows(lesson: SeedLesson) {
  return lesson.exercises.map((e, i) => ({
    question: e.question,
    type: e.type,
    // Cột Json: bỏ trống (undefined) để lưu NULL
    options: e.options ?? undefined,
    correctAnswer: e.answer,
    explanation: e.explanation ?? null,
    audioText: e.audioText ?? null,
    order: i + 1,
  }));
}

function grammarValue(lesson: SeedLesson) {
  return lesson.grammar ? (lesson.grammar as unknown as Prisma.InputJsonValue) : Prisma.DbNull;
}

function lessonCreateData(lesson: SeedLesson, order: number) {
  return {
    title: lesson.title,
    order,
    xpReward: lesson.xp ?? 10,
    grammarNote: grammarValue(lesson),
    vocabularies: { createMany: { data: vocabRows(lesson) } },
    exercises: { createMany: { data: exerciseRows(lesson) } },
  };
}

async function createUnit(courseId: string, unit: SeedCourse["units"][number], order: number) {
  await prisma.unit.create({
    data: {
      courseId,
      title: unit.title,
      order,
      lessons: { create: unit.lessons.map((lesson, lessonIndex) => lessonCreateData(lesson, lessonIndex + 1)) },
    },
  });
}

async function createCourse(course: SeedCourse, order: number) {
  // Tạo từng chương một để mỗi lệnh ghi không quá lớn (khóa từ vựng có hơn 100 bài)
  const created = await prisma.course.create({
    data: {
      title: course.title,
      description: course.description,
      level: course.level,
      isPublished: course.isPublished,
      order,
    },
    select: { id: true },
  });
  for (const [unitIndex, unit] of course.units.entries()) {
    await createUnit(created.id, unit, unitIndex + 1);
  }
}

/** Chuỗi đại diện nội dung để so sánh DB với dữ liệu seed (thứ tự khóa cố định) */
function vocabSignature(v: {
  word: string;
  phonetic: string | null;
  meaning: string;
  exampleSentence: string | null;
  exampleTranslation: string | null;
  cefr: string | null;
}) {
  return JSON.stringify([v.word, v.phonetic, v.meaning, v.exampleSentence, v.exampleTranslation, v.cefr]);
}

function exerciseSignature(e: {
  question: string;
  type: string;
  options: unknown;
  correctAnswer: string;
  explanation: string | null;
  audioText: string | null;
}) {
  return JSON.stringify([e.question, e.type, e.options ?? null, e.correctAnswer, e.explanation, e.audioText]);
}

/** Đồng bộ 1 khóa đã có; trả về số bài được tạo mới hoặc cập nhật */
async function syncCourse(courseId: string, course: SeedCourse, order: number): Promise<number> {
  const dbCourse = await prisma.course.findUniqueOrThrow({
    where: { id: courseId },
    select: {
      description: true,
      level: true,
      order: true,
      isPublished: true,
      units: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              order: true,
              xpReward: true,
              grammarNote: true,
              vocabularies: {
                orderBy: { order: "asc" },
                select: {
                  word: true,
                  phonetic: true,
                  meaning: true,
                  exampleSentence: true,
                  exampleTranslation: true,
                  cefr: true,
                },
              },
              exercises: {
                orderBy: { order: "asc" },
                select: {
                  question: true,
                  type: true,
                  options: true,
                  correctAnswer: true,
                  explanation: true,
                  audioText: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (
    dbCourse.description !== course.description ||
    dbCourse.level !== course.level ||
    dbCourse.order !== order ||
    dbCourse.isPublished !== course.isPublished
  ) {
    await prisma.course.update({
      where: { id: courseId },
      data: { description: course.description, level: course.level, order, isPublished: course.isPublished },
    });
  }

  let changed = 0;
  for (const [unitIndex, unit] of course.units.entries()) {
    const dbUnit = dbCourse.units.find((u) => u.order === unitIndex + 1);
    if (!dbUnit) {
      await createUnit(courseId, unit, unitIndex + 1);
      changed += unit.lessons.length;
      continue;
    }
    if (dbUnit.title !== unit.title) {
      await prisma.unit.update({ where: { id: dbUnit.id }, data: { title: unit.title } });
    }

    for (const [lessonIndex, lesson] of unit.lessons.entries()) {
      const dbLesson = dbUnit.lessons.find((l) => l.order === lessonIndex + 1);
      if (!dbLesson) {
        await prisma.lesson.create({ data: { unitId: dbUnit.id, ...lessonCreateData(lesson, lessonIndex + 1) } });
        changed++;
        continue;
      }

      const vocab = vocabRows(lesson);
      const exercises = exerciseRows(lesson);
      const sameContent =
        dbLesson.vocabularies.map(vocabSignature).join("\n") === vocab.map(vocabSignature).join("\n") &&
        dbLesson.exercises.map(exerciseSignature).join("\n") === exercises.map(exerciseSignature).join("\n");
      const sameInfo =
        dbLesson.title === lesson.title &&
        dbLesson.xpReward === (lesson.xp ?? 10) &&
        stableStringify(dbLesson.grammarNote) === stableStringify(lesson.grammar ?? null);
      if (sameContent && sameInfo) continue;

      await prisma.$transaction([
        prisma.lesson.update({
          where: { id: dbLesson.id },
          data: { title: lesson.title, xpReward: lesson.xp ?? 10, grammarNote: grammarValue(lesson) },
        }),
        ...(sameContent
          ? []
          : [
              prisma.vocabulary.deleteMany({ where: { lessonId: dbLesson.id } }),
              prisma.exercise.deleteMany({ where: { lessonId: dbLesson.id } }),
              prisma.vocabulary.createMany({ data: vocab.map((v) => ({ ...v, lessonId: dbLesson.id })) }),
              prisma.exercise.createMany({ data: exercises.map((e) => ({ ...e, lessonId: dbLesson.id })) }),
            ]),
      ]);
      changed++;
    }
  }
  return changed;
}

async function main() {
  for (const [index, course] of COURSES.entries()) {
    const lessons = course.units.reduce((sum, unit) => sum + unit.lessons.length, 0);
    const existing = await prisma.course.findFirst({ where: { title: course.title }, select: { id: true } });
    if (!existing) {
      await createCourse(course, index);
      console.log(`Đã tạo: ${course.title} (${course.units.length} chương, ${lessons} bài)`);
      continue;
    }
    const changed = await syncCourse(existing.id, course, index);
    console.log(changed > 0 ? `Đã cập nhật ${changed}/${lessons} bài: ${course.title}` : `Không có thay đổi: ${course.title}`);
  }

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);
  for (const user of SEED_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      create: { ...user, passwordHash },
      update: {},
    });
  }

  console.log(`Tài khoản có sẵn (mật khẩu ${SEED_PASSWORD}): ${SEED_USERS.map((u) => u.email).join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
