/**
 * Giáo án "Tiếng Anh A1–A2 trong 30 ngày".
 *
 * - 5 chương x 6 ngày; ngày cuối mỗi chương là bài ôn tập (không có từ mới, nhiều bài tập hơn).
 * - Mỗi bài thường: 6 từ mới (thẻ từ vựng) + 6–7 bài tập: trắc nghiệm, điền từ, nghe (máy đọc) và xếp thẻ từ
 *   thành câu. Bài ôn tập có thêm câu tự nói/viết (có micro) làm thử thách.
 * - Ngữ pháp tăng dần: to be -> a/an -> have/has -> there is/are -> hiện tại đơn -> tần suất
 *   -> some/any -> hiện tại tiếp diễn -> can -> quá khứ đơn -> so sánh -> be going to.
 *
 * Quy ước: trong mc(...) và listen(...) đáp án đúng luôn đứng ĐẦU danh sách lựa chọn (hàm tự xáo khi seed).
 */
import { fill, listen, mc, order, say, v, type SeedCourse } from "./types";

const REVIEW_XP = 20;

export const A1_A2_30_DAYS: SeedCourse = {
  title: "Tiếng Anh A1–A2 trong 30 ngày",
  description:
    "Lộ trình 30 ngày cho người mới bắt đầu: mỗi ngày 1 bài khoảng 15 phút gồm từ mới và bài tập. Cuối mỗi chương có bài ôn tập, ngày 30 là bài kiểm tra cuối khóa.",
  level: "BEGINNER",
  isPublished: true,
  units: [
    // =======================================================================
    // Chương 1: Làm quen (ngày 1–6)
    // =======================================================================
    {
      title: "Làm quen (ngày 1–6)",
      lessons: [
        {
          title: "Chào hỏi và tạm biệt",
          vocab: [
            v("hello", "/həˈləʊ/", "xin chào", "Hello, I am Lan."),
            v("good morning", "/ɡʊd ˈmɔːnɪŋ/", "chào buổi sáng", "Good morning, Mr Nam."),
            v("good afternoon", "/ɡʊd ˌɑːftəˈnuːn/", "chào buổi chiều", "Good afternoon, class."),
            v("good evening", "/ɡʊd ˈiːvnɪŋ/", "chào buổi tối", "Good evening, everyone."),
            v("goodbye", "/ˌɡʊdˈbaɪ/", "tạm biệt", "Goodbye, see you tomorrow."),
            v("thank you", "/ˈθæŋk juː/", "cảm ơn", "Thank you very much."),
          ],
          exercises: [
            mc(
              "Buổi sáng gặp thầy cô, bạn chào thế nào?",
              ["Good morning", "Good night", "Goodbye", "Good evening"],
              "\"Good night\" chỉ dùng để chúc ngủ ngon hoặc chào khi chia tay vào buổi tối muộn.",
            ),
            mc("\"Cảm ơn\" trong tiếng Anh là gì?", ["Thank you", "Sorry", "Please", "Hello"]),
            fill("Good ___, class! (chào buổi chiều)", "afternoon"),
            mc("Ai đó hỏi \"How are you?\". Câu trả lời phù hợp là:", [
              "I'm fine, thank you.",
              "I'm Lan.",
              "Goodbye.",
              "I'm from Vietnam.",
            ]),
            listen(
              "good afternoon",
              ["good afternoon", "good evening", "good morning", "goodbye"],
              "Nghe và chọn lời chào bạn nghe được",
            ),
            order("Cảm ơn bạn rất nhiều.", "Thank you very much", ["many"]),
          ],
        },
        {
          title: "Giới thiệu bản thân (to be)",
          vocab: [
            v("name", "/neɪm/", "tên", "My name is Minh."),
            v("meet", "/miːt/", "gặp", "Nice to meet you."),
            v("from", "/frɒm/", "đến từ", "I am from Hanoi."),
            v("country", "/ˈkʌntri/", "đất nước", "Vietnam is a beautiful country."),
            v("Vietnamese", "/ˌvjetnəˈmiːz/", "người Việt; tiếng Việt", "I am Vietnamese."),
            v("student", "/ˈstjuːdnt/", "học sinh, sinh viên", "I am a student."),
          ],
          exercises: [
            fill("My ___ is Hoa. (tên)", "name"),
            mc("I ___ from Vietnam.", ["am", "is", "are", "be"], "Chủ ngữ I luôn đi với am."),
            mc("You ___ a student.", ["are", "am", "is", "be"], "You/We/They đi với are."),
            mc("Khi gặp ai đó lần đầu, bạn nói:", ["Nice to meet you.", "Good night.", "See you later.", "Thank you."]),
            listen(
              "Nice to meet you",
              ["Nice to meet you", "Nice to see you", "Nice to meet them", "Nice to meet him"],
              "Nghe và chọn câu bạn nghe được",
            ),
            order("Tôi là người Việt Nam.", "I am Vietnamese", ["is", "Vietnam"]),
          ],
        },
        {
          title: "Số đếm và tuổi",
          vocab: [
            v("one", "/wʌn/", "số một", "I have one brother."),
            v("ten", "/ten/", "số mười", "I have ten books."),
            v("twelve", "/twelv/", "số mười hai", "My sister is twelve."),
            v("twenty", "/ˈtwenti/", "số hai mươi", "I am twenty years old."),
            v("old", "/əʊld/", "(… tuổi); già, cũ", "How old are you?"),
            v("phone number", "/ˈfəʊn ˌnʌmbə(r)/", "số điện thoại", "What is your phone number?"),
          ],
          exercises: [
            mc("Số 15 đọc là:", ["fifteen", "fifty", "five", "fiveteen"], "15 = fifteen, còn 50 = fifty."),
            mc("\"Bạn bao nhiêu tuổi?\" là câu nào?", [
              "How old are you?",
              "How are you?",
              "What is your name?",
              "Where are you from?",
            ]),
            fill("I am twenty years ___. (tuổi)", "old"),
            fill("12 = ___ (viết bằng chữ)", "twelve"),
            listen("twelve", ["twelve", "twenty", "two", "ten"], "Nghe và chọn số bạn nghe được"),
            order("Tôi hai mươi tuổi.", "I am twenty years old", ["twelve", "is"]),
          ],
        },
        {
          title: "Nghề nghiệp (a/an)",
          vocab: [
            v("teacher", "/ˈtiːtʃə(r)/", "giáo viên", "My mother is a teacher."),
            v("doctor", "/ˈdɒktə(r)/", "bác sĩ", "He is a doctor."),
            v("engineer", "/ˌendʒɪˈnɪə(r)/", "kỹ sư", "She is an engineer."),
            v("nurse", "/nɜːs/", "y tá", "My aunt is a nurse."),
            v("job", "/dʒɒb/", "công việc, nghề", "What is your job?"),
            v("office", "/ˈɒfɪs/", "văn phòng", "I work in an office."),
          ],
          exercises: [
            mc(
              "She is ___ engineer.",
              ["an", "a", "is", "are"],
              "Dùng an trước từ bắt đầu bằng âm nguyên âm (a, e, i, o, u): an engineer.",
            ),
            mc("He is ___ doctor.", ["a", "an", "are", "am"], "Dùng a trước từ bắt đầu bằng phụ âm: a doctor."),
            mc("\"Y tá\" là:", ["nurse", "doctor", "teacher", "engineer"]),
            fill("What is your ___? – I am a teacher. (nghề nghiệp)", "job"),
            listen("engineer", ["engineer", "teacher", "doctor", "nurse"]),
            order("Anh ấy là giáo viên.", "He is a teacher", ["an", "She"]),
          ],
        },
        {
          title: "Đồ vật trong lớp (this/that, số nhiều)",
          vocab: [
            v("book", "/bʊk/", "quyển sách", "This is my book."),
            v("pen", "/pen/", "cây bút", "That is your pen."),
            v("bag", "/bæɡ/", "cái cặp, cái túi", "These bags are new."),
            v("chair", "/tʃeə(r)/", "cái ghế", "Those chairs are old."),
            v("table", "/ˈteɪbl/", "cái bàn", "The book is on the table."),
            v("window", "/ˈwɪndəʊ/", "cửa sổ", "Open the window, please."),
          ],
          exercises: [
            mc(
              "___ is my pen. (1 vật ở gần)",
              ["This", "That", "These", "Those"],
              "this: 1 vật ở gần; that: 1 vật ở xa; these/those: nhiều vật ở gần/xa.",
            ),
            mc("___ chairs are old. (nhiều vật ở xa)", ["Those", "These", "This", "That"]),
            fill("one book → two ___", "books"),
            mc(
              "Số nhiều của \"box\" là:",
              ["boxes", "boxs", "boxies", "box"],
              "Danh từ tận cùng bằng -s, -x, -ch, -sh thêm -es.",
            ),
            listen(
              "Those chairs are old",
              ["Those chairs are old", "These chairs are old", "Those chairs are new", "That chair is old"],
              "Nghe và chọn câu bạn nghe được",
            ),
            order("Đây là cặp của tôi.", "This is my bag", ["That", "bags"]),
          ],
        },
        {
          title: "Ôn tập: Làm quen",
          xp: REVIEW_XP,
          vocab: [],
          exercises: [
            mc("\"Chào buổi tối\" là:", ["Good evening", "Good night", "Good afternoon", "Good morning"]),
            mc("They ___ students.", ["are", "am", "is", "be"]),
            fill("She is ___ nurse. (a/an)", "a"),
            mc("Số 20 đọc là:", ["twenty", "twelve", "two", "twenty-two"]),
            mc("Where are you from?", ["I am from Vietnam.", "I am twenty.", "I am a student.", "My name is Lan."]),
            fill("___ are my books. (những vật ở gần)", "These"),
            listen("student", ["student", "teacher", "doctor", "nurse"]),
            say("Viết bằng tiếng Anh: \"Rất vui được gặp bạn.\"", "Nice to meet you"),
          ],
        },
      ],
    },

    // =======================================================================
    // Chương 2: Gia đình và nhà cửa (ngày 7–12)
    // =======================================================================
    {
      title: "Gia đình và nhà cửa (ngày 7–12)",
      lessons: [
        {
          title: "Gia đình (have/has)",
          vocab: [
            v("mother", "/ˈmʌðə(r)/", "mẹ", "My mother is a nurse."),
            v("father", "/ˈfɑːðə(r)/", "bố", "My father works in an office."),
            v("brother", "/ˈbrʌðə(r)/", "anh trai, em trai", "I have two brothers."),
            v("sister", "/ˈsɪstə(r)/", "chị gái, em gái", "She has one sister."),
            v("parents", "/ˈpeərənts/", "bố mẹ", "My parents are teachers."),
            v("grandmother", "/ˈɡrænmʌðə(r)/", "bà", "I love my grandmother."),
          ],
          exercises: [
            mc(
              "She ___ two brothers.",
              ["has", "have", "is", "are"],
              "He/She/It đi với has; I/You/We/They đi với have.",
            ),
            mc("I ___ one sister.", ["have", "has", "am", "is"]),
            mc("\"Bố mẹ\" là:", ["parents", "grandparents", "brothers", "sisters"]),
            fill("My father's mother is my ___. (bà)", "grandmother"),
            listen("grandmother", ["grandmother", "mother", "grandfather", "brother"]),
            order("Tôi có hai anh trai.", "I have two brothers", ["has", "brother"]),
          ],
        },
        {
          title: "Miêu tả người (my, his, her...)",
          vocab: [
            v("tall", "/tɔːl/", "cao", "My brother is tall."),
            v("short", "/ʃɔːt/", "thấp; ngắn", "Her hair is short."),
            v("young", "/jʌŋ/", "trẻ", "Our teacher is young."),
            v("kind", "/kaɪnd/", "tốt bụng", "Your mother is very kind."),
            v("hair", "/heə(r)/", "tóc", "His hair is black."),
            v("eyes", "/aɪz/", "đôi mắt", "Their eyes are brown."),
          ],
          exercises: [
            mc("This is Lan. ___ hair is long.", ["Her", "His", "Their", "My"], "Lan là nữ nên dùng her (của cô ấy)."),
            mc("Nam and Minh are brothers. ___ father is a doctor.", ["Their", "His", "Her", "Our"]),
            mc("Trái nghĩa với \"tall\" là:", ["short", "young", "kind", "old"]),
            fill("We love ___ teacher. (của chúng tôi)", "our"),
            listen(
              "Her hair is short",
              ["Her hair is short", "His hair is short", "Her hair is long", "Her eyes are small"],
              "Nghe và chọn câu bạn nghe được",
            ),
            order("Mẹ tôi rất tốt bụng.", "My mother is very kind", ["Her", "are"]),
          ],
        },
        {
          title: "Ngôi nhà (there is/there are)",
          vocab: [
            v("house", "/haʊs/", "ngôi nhà", "My house is small."),
            v("room", "/ruːm/", "căn phòng", "There are four rooms in my house."),
            v("kitchen", "/ˈkɪtʃɪn/", "nhà bếp", "My mother is in the kitchen."),
            v("bedroom", "/ˈbedruːm/", "phòng ngủ", "There is a bed in the bedroom."),
            v("bathroom", "/ˈbɑːθruːm/", "phòng tắm", "The bathroom is next to my bedroom."),
            v("living room", "/ˈlɪvɪŋ ruːm/", "phòng khách", "We watch TV in the living room."),
          ],
          exercises: [
            mc(
              "There ___ a sofa in the living room.",
              ["is", "are", "am", "be"],
              "There is + danh từ số ít; There are + danh từ số nhiều.",
            ),
            mc("There ___ three bedrooms in my house.", ["are", "is", "am", "be"]),
            mc("\"Nhà bếp\" là:", ["kitchen", "bathroom", "bedroom", "living room"]),
            fill("___ is a TV in my bedroom. (Có)", "There"),
            listen("kitchen", ["kitchen", "chicken", "bathroom", "bedroom"]),
            order("Có hai phòng ngủ trong nhà tôi.", "There are two bedrooms in my house", ["is", "on"]),
          ],
        },
        {
          title: "Vị trí đồ vật (in, on, under...)",
          vocab: [
            v("in", "/ɪn/", "ở trong", "The cat is in the box."),
            v("on", "/ɒn/", "ở trên (bề mặt)", "The book is on the table."),
            v("under", "/ˈʌndə(r)/", "ở dưới", "The shoes are under the bed."),
            v("next to", "/ˈnekst tə/", "bên cạnh", "The bank is next to the school."),
            v("behind", "/bɪˈhaɪnd/", "phía sau", "The garden is behind the house."),
            v("between", "/bɪˈtwiːn/", "ở giữa", "I sit between Lan and Minh."),
          ],
          exercises: [
            mc("Con mèo nằm DƯỚI gầm bàn: The cat is ___ the table.", ["under", "in", "on", "behind"]),
            mc("Quyển sách nằm TRÊN mặt bàn: The book is ___ the table.", ["on", "in", "under", "between"]),
            mc("\"Bên cạnh\" là:", ["next to", "between", "behind", "under"]),
            fill("The bank is ___ the school and the park. (ở giữa)", "between"),
            listen("between", ["between", "behind", "next to", "under"]),
            order("Cái cặp ở trên ghế.", "The bag is on the chair", ["under", "in"]),
          ],
        },
        {
          title: "Màu sắc",
          vocab: [
            v("red", "/red/", "màu đỏ", "The apple is red."),
            v("blue", "/bluː/", "màu xanh dương", "The sky is blue."),
            v("green", "/ɡriːn/", "màu xanh lá", "The leaves are green."),
            v("yellow", "/ˈjeləʊ/", "màu vàng", "The banana is yellow."),
            v("black", "/blæk/", "màu đen", "My cat is black."),
            v("white", "/waɪt/", "màu trắng", "The wall is white."),
          ],
          exercises: [
            mc("What colour is the sky? – It is ___.", ["blue", "red", "black", "green"]),
            mc("\"Màu vàng\" là:", ["yellow", "white", "green", "red"]),
            mc(
              "Chọn câu đúng:",
              ["It is a red car.", "It is a car red.", "It is red a car.", "It a red car is."],
              "Tính từ (màu sắc) đứng trước danh từ: a red car.",
            ),
            fill("Snow is ___. (trắng)", "white"),
            listen("yellow", ["yellow", "white", "blue", "red"], "Nghe và chọn màu bạn nghe được"),
            order("Con mèo của tôi màu đen.", "My cat is black", ["white", "a"]),
          ],
        },
        {
          title: "Ôn tập: Gia đình và nhà cửa",
          xp: REVIEW_XP,
          vocab: [],
          exercises: [
            mc("He ___ a big family.", ["has", "have", "is", "are"]),
            mc("Mai is my sister. ___ eyes are black.", ["Her", "His", "Its", "Their"]),
            mc("There ___ two windows in my room.", ["are", "is", "am", "has"]),
            fill("The shoes are ___ the bed. (ở dưới)", "under"),
            listen(
              "There is a sofa in the living room",
              [
                "There is a sofa in the living room",
                "There is a sofa in the bedroom",
                "There are sofas in the living room",
                "There is a table in the living room",
              ],
              "Nghe và chọn câu bạn nghe được",
            ),
            mc("Chọn câu đúng:", [
              "She has a blue bag.",
              "She has a bag blue.",
              "She have a blue bag.",
              "She is a blue bag.",
            ]),
            fill("My ___ are my mother and my father. (bố mẹ)", "parents"),
            say("Viết bằng tiếng Anh: \"Có một cái bàn trong nhà bếp.\"", "There is a table in the kitchen"),
          ],
        },
      ],
    },

    // =======================================================================
    // Chương 3: Một ngày của tôi (ngày 13–18)
    // =======================================================================
    {
      title: "Một ngày của tôi (ngày 13–18)",
      lessons: [
        {
          title: "Giờ giấc",
          vocab: [
            v("o'clock", "/əˈklɒk/", "(… giờ) đúng", "It is seven o'clock."),
            v("half past", "/hɑːf pɑːst/", "(… giờ) rưỡi", "It is half past six."),
            v("quarter", "/ˈkwɔːtə(r)/", "mười lăm phút (một phần tư giờ)", "It is a quarter past eight."),
            v("minute", "/ˈmɪnɪt/", "phút", "Wait a minute, please."),
            v("hour", "/ˈaʊə(r)/", "giờ, tiếng đồng hồ", "I study for one hour."),
            v("time", "/taɪm/", "thời gian; giờ", "What time is it?"),
          ],
          exercises: [
            mc("7:00 đọc là:", ["seven o'clock", "half past seven", "seven past", "a quarter to seven"]),
            mc(
              "6:30 đọc là:",
              ["half past six", "half past seven", "six o'clock", "a quarter past six"],
              "half past six = 6 giờ rưỡi (qua 6 giờ nửa tiếng).",
            ),
            mc("\"Bây giờ là mấy giờ?\" là:", ["What time is it?", "How old are you?", "What is it?", "How are you?"]),
            fill("One ___ has sixty minutes. (tiếng đồng hồ)", "hour"),
            listen(
              "half past six",
              ["half past six", "half past seven", "six o'clock", "a quarter past six"],
              "Nghe và chọn giờ bạn nghe được",
            ),
            order("Bây giờ là 8 giờ đúng.", "It is eight o'clock", ["half", "past"]),
          ],
        },
        {
          title: "Thói quen hằng ngày (hiện tại đơn)",
          vocab: [
            v("get up", "/ɡet ʌp/", "thức dậy", "I get up at six o'clock."),
            v("have breakfast", "/hæv ˈbrekfəst/", "ăn sáng", "We have breakfast at home."),
            v("go to school", "/ɡəʊ tə skuːl/", "đi học", "They go to school by bike."),
            v("go to work", "/ɡəʊ tə wɜːk/", "đi làm", "My parents go to work at seven."),
            v("have lunch", "/hæv lʌntʃ/", "ăn trưa", "I have lunch at twelve o'clock."),
            v("go to bed", "/ɡəʊ tə bed/", "đi ngủ", "I go to bed at ten."),
          ],
          exercises: [
            mc(
              "I ___ up at six o'clock.",
              ["get", "gets", "getting", "got"],
              "Thói quen hằng ngày dùng thì hiện tại đơn; I/You/We/They giữ nguyên động từ.",
            ),
            mc("\"Đi ngủ\" là:", ["go to bed", "get up", "go to work", "have lunch"]),
            fill("We ___ lunch at school. (ăn)", "have"),
            mc("They ___ to work by bus.", ["go", "goes", "going", "is go"]),
            listen("have breakfast", ["have breakfast", "have lunch", "go to bed", "get up"]),
            order("Tôi đi ngủ lúc 10 giờ.", "I go to bed at ten o'clock", ["get", "up"]),
          ],
        },
        {
          title: "Hiện tại đơn với he/she/it",
          vocab: [
            v("live", "/lɪv/", "sống", "She lives in Da Nang."),
            v("work", "/wɜːk/", "làm việc", "He works in a hospital."),
            v("study", "/ˈstʌdi/", "học", "They study English at school."),
            v("watch", "/wɒtʃ/", "xem", "He watches TV every evening."),
            v("play", "/pleɪ/", "chơi", "Nam plays football."),
            v("like", "/laɪk/", "thích", "She likes music."),
          ],
          exercises: [
            mc("She ___ in Ho Chi Minh City.", ["lives", "live", "living", "is live"], "He/She/It: động từ thêm -s."),
            mc(
              "He ___ TV every evening.",
              ["watches", "watchs", "watch", "watching"],
              "Động từ tận cùng -ch, -sh, -s, -x, -o thêm -es khi đi với he/she/it.",
            ),
            mc("My sister ___ English.", ["studies", "studys", "study", "studying"], "Phụ âm + y → bỏ y, thêm -ies."),
            mc(
              "He ___ like coffee.",
              ["doesn't", "don't", "isn't", "not"],
              "Phủ định với he/she/it: doesn't + động từ nguyên mẫu.",
            ),
            fill("___ she work in an office? (Cô ấy có … không?)", "Does"),
            listen(
              "She watches TV every evening",
              [
                "She watches TV every evening",
                "She watch TV every evening",
                "He watches TV every evening",
                "She watches TV every morning",
              ],
              "Nghe và chọn câu bạn nghe được",
            ),
            order("Anh ấy chơi bóng đá.", "He plays football", ["play", "She"]),
          ],
        },
        {
          title: "Mức độ thường xuyên (always, never...)",
          vocab: [
            v("always", "/ˈɔːlweɪz/", "luôn luôn", "I always get up early."),
            v("usually", "/ˈjuːʒuəli/", "thường thường", "She usually has breakfast at home."),
            v("often", "/ˈɒfn/", "thường, hay", "We often play football."),
            v("sometimes", "/ˈsʌmtaɪmz/", "thỉnh thoảng", "He sometimes goes to school late."),
            v("never", "/ˈnevə(r)/", "không bao giờ", "My father never drinks coffee."),
            v("every day", "/ˈevri deɪ/", "mỗi ngày", "I study English every day."),
          ],
          exercises: [
            mc(
              "Chọn câu đúng:",
              ["She is always happy.", "She always is happy.", "Always she is happy.", "She is happy always."],
              "Trạng từ tần suất đứng SAU động từ to be và TRƯỚC động từ thường.",
            ),
            mc("Chọn câu đúng về thói quen:", [
              "I often play tennis.",
              "I play often tennis.",
              "Often I tennis play.",
              "I often plays tennis.",
            ]),
            mc("\"Không bao giờ\" là:", ["never", "sometimes", "often", "always"]),
            fill("I study English every ___. (ngày)", "day"),
            listen("usually", ["usually", "always", "sometimes", "often"]),
            order("Tôi thỉnh thoảng xem TV.", "I sometimes watch TV", ["never", "watches"]),
          ],
        },
        {
          title: "Ngày trong tuần (in/on/at)",
          vocab: [
            v("Monday", "/ˈmʌndeɪ/", "thứ Hai", "I go to school on Monday."),
            v("Saturday", "/ˈsætədeɪ/", "thứ Bảy", "We play football on Saturday."),
            v("Sunday", "/ˈsʌndeɪ/", "Chủ nhật", "My family goes to the park on Sunday."),
            v("weekend", "/ˌwiːkˈend/", "cuối tuần", "What do you do at the weekend?"),
            v("morning", "/ˈmɔːnɪŋ/", "buổi sáng", "I study in the morning."),
            v("evening", "/ˈiːvnɪŋ/", "buổi tối", "We watch TV in the evening."),
          ],
          exercises: [
            mc(
              "I have English class ___ Monday.",
              ["on", "in", "at", "to"],
              "on + thứ trong tuần; at + giờ; in + buổi (in the morning).",
            ),
            mc("The film starts ___ eight o'clock.", ["at", "on", "in", "to"]),
            mc("She reads books ___ the evening.", ["in", "on", "at", "to"]),
            mc("Ngày sau thứ Bảy là:", ["Sunday", "Monday", "Friday", "Saturday"]),
            listen("Saturday", ["Saturday", "Sunday", "Monday", "Thursday"]),
            order("Tôi học tiếng Anh vào buổi sáng.", "I study English in the morning", ["on", "evening"]),
          ],
        },
        {
          title: "Ôn tập: Một ngày của tôi",
          xp: REVIEW_XP,
          vocab: [],
          exercises: [
            listen(
              "a quarter past eight",
              ["a quarter past eight", "half past eight", "eight o'clock", "a quarter to eight"],
              "Nghe và chọn giờ bạn nghe được",
            ),
            mc("He ___ breakfast at seven.", ["has", "have", "haves", "having"]),
            mc("My brother ___ football every Sunday.", ["plays", "play", "playing", "is play"]),
            mc("___ your mother work in a hospital?", ["Does", "Do", "Is", "Are"]),
            fill("I go to bed ___ ten o'clock.", "at"),
            mc("Chọn câu đúng:", ["We are never late.", "We never are late.", "Never we are late.", "We are late never."]),
            fill("They ___ go to school on Sunday. (không, dùng dạng viết tắt)", "don't"),
            say("Viết bằng tiếng Anh: \"Cô ấy luôn luôn ăn sáng ở nhà.\"", "She always has breakfast at home"),
          ],
        },
      ],
    },

    // =======================================================================
    // Chương 4: Ăn uống và mua sắm (ngày 19–24)
    // =======================================================================
    {
      title: "Ăn uống và mua sắm (ngày 19–24)",
      lessons: [
        {
          title: "Đồ ăn thức uống (đếm được/không đếm được)",
          vocab: [
            v("rice", "/raɪs/", "cơm, gạo", "We eat rice every day."),
            v("bread", "/bred/", "bánh mì", "I have bread for breakfast."),
            v("egg", "/eɡ/", "quả trứng", "She eats an egg every morning."),
            v("apple", "/ˈæpl/", "quả táo", "An apple a day is good for you."),
            v("water", "/ˈwɔːtə(r)/", "nước", "Drink some water."),
            v("milk", "/mɪlk/", "sữa", "The children drink milk."),
          ],
          exercises: [
            mc("I eat ___ egg for breakfast.", ["an", "a", "some", "any"], "egg bắt đầu bằng nguyên âm nên dùng an."),
            mc(
              "Danh từ nào KHÔNG đếm được?",
              ["water", "apple", "egg", "banana"],
              "Chất lỏng (water, milk) là danh từ không đếm được: không dùng a/an, không thêm -s.",
            ),
            mc(
              "Can I have ___ water, please?",
              ["some", "a", "an", "many"],
              "some dùng với danh từ không đếm được hoặc số nhiều, trong câu khẳng định và lời mời/xin.",
            ),
            fill("one apple → three ___", "apples"),
            listen("bread", ["bread", "bed", "red", "egg"]),
            order("Tôi ăn cơm mỗi ngày.", "I eat rice every day", ["eats", "an"]),
          ],
        },
        {
          title: "Gọi món (some/any, would like)",
          vocab: [
            v("menu", "/ˈmenjuː/", "thực đơn", "Can I see the menu, please?"),
            v("order", "/ˈɔːdə(r)/", "gọi món", "Are you ready to order?"),
            v("coffee", "/ˈkɒfi/", "cà phê", "A black coffee, please."),
            v("tea", "/tiː/", "trà", "I would like a cup of tea."),
            v("would like", "/wʊd laɪk/", "muốn (cách nói lịch sự)", "I would like some noodles."),
            v("bill", "/bɪl/", "hóa đơn", "Can I have the bill, please?"),
          ],
          exercises: [
            mc(
              "Is there ___ milk in the fridge?",
              ["any", "some", "a", "an"],
              "any dùng trong câu hỏi và câu phủ định.",
            ),
            mc("We don't have ___ bread.", ["any", "some", "a", "an"]),
            mc("Cách gọi món lịch sự nhất:", [
              "I would like a cup of tea, please.",
              "Give me tea.",
              "Tea!",
              "I want tea now.",
            ]),
            fill("Can I have the ___, please? (hóa đơn)", "bill"),
            listen(
              "Can I have the bill, please?",
              [
                "Can I have the bill, please?",
                "Can I have the menu, please?",
                "Can I see the bill, please?",
                "Can I have a bill, please?",
              ],
              "Nghe và chọn câu bạn nghe được",
            ),
            order("Tôi muốn một tách cà phê.", "I would like a cup of coffee", ["want", "tea"]),
          ],
        },
        {
          title: "Mua sắm (How much/How many)",
          vocab: [
            v("price", "/praɪs/", "giá", "What is the price of this bag?"),
            v("cheap", "/tʃiːp/", "rẻ", "These shoes are cheap."),
            v("expensive", "/ɪkˈspensɪv/", "đắt", "The phone is very expensive."),
            v("buy", "/baɪ/", "mua", "I want to buy a new bag."),
            v("money", "/ˈmʌni/", "tiền", "I don't have much money."),
            v("shop", "/ʃɒp/", "cửa hàng", "The shop opens at nine o'clock."),
          ],
          exercises: [
            mc(
              "How ___ is this T-shirt? – It is 100.000 đồng.",
              ["much", "many", "old", "long"],
              "Hỏi giá: How much is/are …?",
            ),
            mc(
              "How ___ apples do you want?",
              ["many", "much", "any", "some"],
              "How many + danh từ đếm được số nhiều; How much + danh từ không đếm được.",
            ),
            mc("Trái nghĩa với \"cheap\" là:", ["expensive", "price", "money", "buy"]),
            fill("I want to ___ a new phone. (mua)", "buy"),
            listen("expensive", ["expensive", "cheap", "price", "money"]),
            order("Cái túi này bao nhiêu tiền?", "How much is this bag", ["many", "are"]),
          ],
        },
        {
          title: "Quần áo (hiện tại tiếp diễn)",
          vocab: [
            v("shirt", "/ʃɜːt/", "áo sơ mi", "He is wearing a white shirt."),
            v("dress", "/dres/", "váy liền", "She is wearing a red dress."),
            v("shoes", "/ʃuːz/", "đôi giày", "My shoes are new."),
            v("jeans", "/dʒiːnz/", "quần bò", "I usually wear jeans."),
            v("jacket", "/ˈdʒækɪt/", "áo khoác", "Take your jacket. It is cold."),
            v("wear", "/weə(r)/", "mặc, đeo", "What are you wearing today?"),
          ],
          exercises: [
            mc(
              "She ___ a blue dress now.",
              ["is wearing", "wears", "wear", "are wearing"],
              "Hành động đang diễn ra (now, at the moment): am/is/are + V-ing.",
            ),
            mc("They ___ football at the moment.", ["are playing", "play", "is playing", "plays"]),
            mc(
              "Dạng V-ing của \"run\" là:",
              ["running", "runing", "runs", "runned"],
              "Động từ 1 âm tiết tận cùng phụ âm-nguyên âm-phụ âm thì gấp đôi phụ âm cuối: run → running.",
            ),
            fill("I am ___ jeans today. (mặc, dạng V-ing)", "wearing"),
            listen(
              "She is wearing a red dress",
              [
                "She is wearing a red dress",
                "She wears a red dress",
                "She is wearing a red shirt",
                "He is wearing a red dress",
              ],
              "Nghe và chọn câu bạn nghe được",
            ),
            order("Anh ấy đang mặc áo khoác.", "He is wearing a jacket", ["wears", "shirt"]),
          ],
        },
        {
          title: "Khả năng và sở thích (can, like + V-ing)",
          vocab: [
            v("swim", "/swɪm/", "bơi", "I can swim."),
            v("cook", "/kʊk/", "nấu ăn", "My father can cook very well."),
            v("sing", "/sɪŋ/", "hát", "She likes singing."),
            v("dance", "/dɑːns/", "nhảy, múa", "They can dance."),
            v("draw", "/drɔː/", "vẽ", "My brother likes drawing."),
            v("ride a bike", "/raɪd ə baɪk/", "đi xe đạp", "Can you ride a bike?"),
          ],
          exercises: [
            mc(
              "She can ___ very well.",
              ["sing", "sings", "singing", "to sing"],
              "Sau can dùng động từ nguyên mẫu không có to.",
            ),
            mc("I like ___ books.", ["reading", "reads", "readed", "to reading"], "like + V-ing: thích làm gì."),
            mc("Can you swim? – No, I ___.", ["can't", "don't", "am not", "doesn't"]),
            fill("My mother ___ cook very well. (có thể)", "can"),
            listen("swim", ["swim", "sing", "dance", "draw"]),
            order("Tôi có thể đi xe đạp.", "I can ride a bike", ["can't", "riding"]),
          ],
        },
        {
          title: "Ôn tập: Ăn uống và mua sắm",
          xp: REVIEW_XP,
          vocab: [],
          exercises: [
            mc("There is ___ milk in the glass.", ["some", "a", "an", "many"]),
            mc("Are there ___ eggs?", ["any", "some", "a", "much"]),
            mc("How ___ is the jacket?", ["much", "many", "old", "any"]),
            mc("Look! The children ___ in the garden.", ["are playing", "play", "plays", "is playing"]),
            fill("He can ___ fast. (bơi)", "swim"),
            listen("jacket", ["jacket", "jeans", "shirt", "dress"]),
            fill("She likes ___ pictures. (vẽ, dạng V-ing)", "drawing"),
            say("Viết bằng tiếng Anh (dùng don't): \"Tôi không thích cà phê.\"", "I don't like coffee"),
          ],
        },
      ],
    },

    // =======================================================================
    // Chương 5: Quá khứ và kế hoạch (ngày 25–30)
    // =======================================================================
    {
      title: "Quá khứ và kế hoạch (ngày 25–30)",
      lessons: [
        {
          title: "Hôm qua (was/were)",
          vocab: [
            v("yesterday", "/ˈjestədeɪ/", "hôm qua", "I was at home yesterday."),
            v("last week", "/lɑːst wiːk/", "tuần trước", "We were in Hue last week."),
            v("ago", "/əˈɡəʊ/", "cách đây", "She was a student two years ago."),
            v("born", "/bɔːn/", "được sinh ra", "I was born in 2005."),
            v("tired", "/ˈtaɪəd/", "mệt", "They were tired after work."),
            v("happy", "/ˈhæpi/", "vui vẻ", "He was very happy yesterday."),
          ],
          exercises: [
            mc("I ___ at home yesterday.", ["was", "were", "am", "is"], "Quá khứ của am/is là was."),
            mc("They ___ tired last night.", ["were", "was", "are", "is"], "Quá khứ của are là were."),
            mc("Where ___ you born?", ["were", "was", "are", "did"]),
            fill("She was a teacher five years ___. (cách đây)", "ago"),
            listen(
              "They were happy last week",
              [
                "They were happy last week",
                "They are happy this week",
                "They were tired last week",
                "They were happy last night",
              ],
              "Nghe và chọn câu bạn nghe được",
            ),
            order(
              "Hôm qua tôi rất mệt.",
              "I was very tired yesterday",
              ["were", "am"],
              "Từ chỉ thời gian như yesterday thường đứng cuối câu.",
            ),
          ],
        },
        {
          title: "Quá khứ đơn: động từ có quy tắc",
          vocab: [
            v("visit", "/ˈvɪzɪt/", "thăm", "We visited our grandparents last Sunday."),
            v("clean", "/kliːn/", "dọn dẹp, lau chùi", "I cleaned my room yesterday."),
            v("stay", "/steɪ/", "ở lại", "They stayed at home last weekend."),
            v("listen", "/ˈlɪsn/", "nghe", "She listened to music last night."),
            v("walk", "/wɔːk/", "đi bộ", "He walked to school yesterday."),
            v("last night", "/lɑːst naɪt/", "tối qua", "I watched a film last night."),
          ],
          exercises: [
            mc("I ___ my room yesterday.", ["cleaned", "clean", "cleans", "cleaning"], "Động từ có quy tắc: thêm -ed."),
            mc("Quá khứ của \"study\" là:", ["studied", "studyed", "studed", "studies"], "Phụ âm + y → bỏ y, thêm -ied."),
            mc(
              "She ___ visit her aunt last week.",
              ["didn't", "doesn't", "wasn't", "don't"],
              "Phủ định quá khứ: didn't + động từ nguyên mẫu.",
            ),
            fill("___ you watch TV last night? (trợ động từ quá khứ)", "Did"),
            listen("walked", ["walked", "watched", "worked", "wanted"]),
            order("Chúng tôi ở nhà tối qua.", "We stayed at home last night", ["stay", "in"]),
          ],
        },
        {
          title: "Quá khứ đơn: động từ bất quy tắc",
          vocab: [
            v("went", "/went/", "đã đi (quá khứ của go)", "I went to Hanoi last year."),
            v("ate", "/eɪt/", "đã ăn (quá khứ của eat)", "We ate noodles for breakfast."),
            v("saw", "/sɔː/", "đã thấy, đã xem (quá khứ của see)", "I saw a good film yesterday."),
            v("bought", "/bɔːt/", "đã mua (quá khứ của buy)", "She bought a new dress."),
            v("had", "/hæd/", "đã có, đã ăn (quá khứ của have)", "We had a great time."),
            v("took", "/tʊk/", "đã lấy, đã chụp (quá khứ của take)", "He took many photos."),
          ],
          exercises: [
            mc("Quá khứ của \"go\" là:", ["went", "goed", "gone", "goes"]),
            mc("Yesterday I ___ a new bag.", ["bought", "buyed", "buy", "buys"]),
            mc("Did you see the film? – Yes, I ___ it last night.", ["saw", "see", "seed", "seen"]),
            fill("We ___ rice and fish for lunch. (quá khứ của eat)", "ate"),
            listen(
              "I saw a good film yesterday",
              [
                "I saw a good film yesterday",
                "I see a good film every day",
                "I saw a good film today",
                "I saw a good film last week",
              ],
              "Nghe và chọn câu bạn nghe được",
            ),
            order(
              "Cô ấy đã mua một chiếc váy mới.",
              "She bought a new dress",
              ["buyed", "buys"],
              "buy là động từ bất quy tắc: buy → bought.",
            ),
          ],
        },
        {
          title: "So sánh hơn và so sánh nhất",
          vocab: [
            v("big", "/bɪɡ/", "to, lớn", "An elephant is bigger than a horse."),
            v("small", "/smɔːl/", "nhỏ", "This is the smallest room."),
            v("fast", "/fɑːst/", "nhanh", "A car is faster than a bike."),
            v("beautiful", "/ˈbjuːtɪfl/", "đẹp", "Ha Long Bay is very beautiful."),
            v("good", "/ɡʊd/", "tốt, giỏi", "She is a good student."),
            v("than", "/ðæn/", "hơn (dùng khi so sánh)", "My brother is taller than me."),
          ],
          exercises: [
            mc(
              "A plane is ___ than a car.",
              ["faster", "fastest", "more fast", "fast"],
              "Tính từ ngắn: thêm -er + than.",
            ),
            mc(
              "This is ___ bag in the shop.",
              ["the most expensive", "the expensivest", "more expensive", "most expensive"],
              "Tính từ dài: the most + tính từ.",
            ),
            mc("So sánh hơn của \"good\" là:", ["better", "gooder", "more good", "best"]),
            fill("Russia is ___ than Vietnam. (to hơn)", "bigger", "big → bigger: gấp đôi phụ âm cuối rồi thêm -er."),
            listen("beautiful", ["beautiful", "bigger", "fastest", "better"]),
            order("Chị tôi cao hơn tôi.", "My sister is taller than me", ["tallest", "more"]),
          ],
        },
        {
          title: "Kế hoạch du lịch (be going to)",
          vocab: [
            v("travel", "/ˈtrævl/", "đi du lịch", "I love to travel."),
            v("ticket", "/ˈtɪkɪt/", "vé", "I am going to buy a train ticket."),
            v("hotel", "/həʊˈtel/", "khách sạn", "We are going to stay in a hotel."),
            v("beach", "/biːtʃ/", "bãi biển", "They are going to swim at the beach."),
            v("tomorrow", "/təˈmɒrəʊ/", "ngày mai", "What are you going to do tomorrow?"),
            v("next", "/nekst/", "tới, kế tiếp", "We are going to visit Da Lat next month."),
          ],
          exercises: [
            mc(
              "I ___ going to visit my grandmother tomorrow.",
              ["am", "is", "are", "be"],
              "Kế hoạch đã định: am/is/are + going to + động từ nguyên mẫu.",
            ),
            mc("They are going ___ a hotel room.", ["to book", "book", "booking", "to booking"]),
            mc("Câu nào nói về kế hoạch trong tương lai?", [
              "We are going to travel next week.",
              "We travelled last week.",
              "We travel every week.",
              "We are travelling now.",
            ]),
            fill("She is going to buy a train ___. (vé)", "ticket"),
            listen(
              "They are going to swim at the beach",
              [
                "They are going to swim at the beach",
                "They are going to swim at the pool",
                "They are swimming at the beach",
                "They went to swim at the beach",
              ],
              "Nghe và chọn câu bạn nghe được",
            ),
            order("Chúng tôi định ở khách sạn.", "We are going to stay in a hotel", ["will", "stays"]),
          ],
        },
        {
          title: "Tổng ôn và kiểm tra cuối khóa",
          xp: 30,
          vocab: [],
          exercises: [
            listen(
              "She is a doctor",
              ["She is a doctor", "She was a doctor", "He is a doctor", "She is a teacher"],
              "Nghe và chọn câu bạn nghe được",
            ),
            mc("There ___ three apples on the table.", ["are", "is", "am", "be"]),
            mc("He ___ to work every day.", ["goes", "go", "going", "is go"]),
            mc("Look! It ___.", ["is raining", "rains", "rain", "rained"]),
            order("Tôi đã đến Hà Nội năm ngoái.", "I went to Hanoi last year", ["go", "goes"]),
            fill("Is there ___ milk? (some/any)", "any"),
            mc("My bag is ___ than your bag.", ["bigger", "biggest", "more big", "big"]),
            fill("We are going ___ visit Hue next month.", "to"),
            mc("I can ___ English.", ["speak", "speaks", "speaking", "to speak"]),
            say("Viết bằng tiếng Anh: \"Tôi học tiếng Anh mỗi ngày.\"", "I study English every day"),
          ],
        },
      ],
    },
  ],
};
