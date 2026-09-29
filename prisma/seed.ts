/**
 * Dữ liệu mẫu: các khóa học + 1 tài khoản demo.
 * Chạy: npm run db:seed
 *
 * Không xóa dữ liệu cũ: khóa học nào đã có (trùng tên) thì bỏ qua, nên tiến độ học của user được giữ nguyên.
 * Muốn nạp lại 1 khóa sau khi sửa nội dung: xóa khóa đó trong DB (npm run db:studio) rồi chạy lại seed.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { A1_A2_30_DAYS } from "./data/a1-a2-30-days";
import { fill, mc, type SeedCourse } from "./data/types";

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
          lessons: {
            create: unit.lessons.map((lesson, lessonIndex) => ({
              title: lesson.title,
              order: lessonIndex + 1,
              xpReward: lesson.xp ?? 10,
              vocabularies: {
                create: lesson.vocab.map((v, i) => ({
                  word: v.word,
                  phonetic: v.phonetic,
                  meaning: v.meaning,
                  exampleSentence: v.example,
                  order: i,
                })),
              },
              exercises: {
                create: lesson.exercises.map((e, i) => ({
                  question: e.question,
                  type: e.type,
                  options: e.options,
                  correctAnswer: e.answer,
                  explanation: e.explanation,
                  order: i + 1,
                })),
              },
            })),
          },
        })),
      },
    },
  });
}

async function main() {
  for (const [index, course] of COURSES.entries()) {
    const existing = await prisma.course.findFirst({ where: { title: course.title }, select: { id: true } });
    if (existing) {
      console.log(`Bỏ qua (đã có): ${course.title}`);
      continue;
    }
    await createCourse(course, index);
    const lessons = course.units.reduce((sum, unit) => sum + unit.lessons.length, 0);
    console.log(`Đã tạo: ${course.title} (${course.units.length} chương, ${lessons} bài)`);
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
