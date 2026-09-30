/**
 * Dữ liệu mẫu: các khóa học + 1 tài khoản demo.
 * Chạy: npm run db:seed
 *
 * Khóa học chưa có (theo tên) thì tạo mới. Khóa đã có thì đồng bộ theo thứ tự chương/bài: bài nào đổi nội dung
 * thì thay từ vựng + bài tập của bài đó. ID bài học giữ nguyên nên tiến độ và XP của người học không bị ảnh hưởng.
 * Không bao giờ xóa chương/bài đang có trong DB.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { A1_A2_30_DAYS } from "./data/a1-a2-30-days";
import { fill, mc, type SeedCourse, type SeedLesson } from "./data/types";

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
          vocab: [
            { word: "already", phonetic: "/ɔːlˈredi/", meaning: "đã (rồi)", example: "I have already finished my homework." },
            { word: "yet", phonetic: "/jet/", meaning: "chưa (câu phủ định/nghi vấn)", example: "Have you eaten yet?" },
            { word: "since", phonetic: "/sɪns/", meaning: "kể từ", example: "She has lived here since 2020." },
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

const COURSES: SeedCourse[] = [A1_A2_30_DAYS, INTERMEDIATE_GRAMMAR, ACADEMIC_ENGLISH];

function vocabRows(lesson: SeedLesson) {
  return lesson.vocab.map((v, i) => ({
    word: v.word,
    phonetic: v.phonetic ?? null,
    meaning: v.meaning,
    exampleSentence: v.example ?? null,
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

function lessonCreateData(lesson: SeedLesson, order: number) {
  return {
    title: lesson.title,
    order,
    xpReward: lesson.xp ?? 10,
    vocabularies: { create: vocabRows(lesson) },
    exercises: { create: exerciseRows(lesson) },
  };
}

async function createCourse(course: SeedCourse, order: number) {
  await prisma.course.create({
    data: {
      title: course.title,
      description: course.description,
      level: course.level,
      isPublished: course.isPublished,
      order,
      units: {
        create: course.units.map((unit, unitIndex) => ({
          title: unit.title,
          order: unitIndex + 1,
          lessons: { create: unit.lessons.map((lesson, lessonIndex) => lessonCreateData(lesson, lessonIndex + 1)) },
        })),
      },
    },
  });
}

/** Chuỗi đại diện nội dung để so sánh DB với dữ liệu seed (thứ tự khóa cố định) */
function vocabSignature(v: { word: string; phonetic: string | null; meaning: string; exampleSentence: string | null }) {
  return JSON.stringify([v.word, v.phonetic, v.meaning, v.exampleSentence]);
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
async function syncCourse(courseId: string, course: SeedCourse): Promise<number> {
  const dbCourse = await prisma.course.findUniqueOrThrow({
    where: { id: courseId },
    select: {
      description: true,
      level: true,
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
              vocabularies: {
                orderBy: { order: "asc" },
                select: { word: true, phonetic: true, meaning: true, exampleSentence: true },
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

  if (dbCourse.description !== course.description || dbCourse.level !== course.level) {
    await prisma.course.update({
      where: { id: courseId },
      data: { description: course.description, level: course.level },
    });
  }

  let changed = 0;
  for (const [unitIndex, unit] of course.units.entries()) {
    const dbUnit = dbCourse.units.find((u) => u.order === unitIndex + 1);
    if (!dbUnit) {
      await prisma.unit.create({
        data: {
          courseId,
          title: unit.title,
          order: unitIndex + 1,
          lessons: { create: unit.lessons.map((lesson, lessonIndex) => lessonCreateData(lesson, lessonIndex + 1)) },
        },
      });
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
      const sameInfo = dbLesson.title === lesson.title && dbLesson.xpReward === (lesson.xp ?? 10);
      if (sameContent && sameInfo) continue;

      await prisma.$transaction([
        prisma.lesson.update({
          where: { id: dbLesson.id },
          data: { title: lesson.title, xpReward: lesson.xp ?? 10 },
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
    const changed = await syncCourse(existing.id, course);
    console.log(changed > 0 ? `Đã cập nhật ${changed}/${lessons} bài: ${course.title}` : `Không có thay đổi: ${course.title}`);
  }

  const passwordHash = await bcrypt.hash("123456", 12);
  await prisma.user.upsert({
    where: { email: "demo@example.com" },
    create: { email: "demo@example.com", name: "Nguyễn Văn Demo", passwordHash },
    update: {},
  });

  console.log("Tài khoản demo: demo@example.com / 123456");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
