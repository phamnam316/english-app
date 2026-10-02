/**
 * Giáo án "Tiếng Anh A1–A2 trong 30 ngày".
 *
 * - 5 chương x 6 ngày; ngày cuối mỗi chương là bài ôn tập (không có từ mới, nhiều bài tập hơn).
 * - Mỗi bài thường: 6 từ mới (thẻ từ vựng) + ghi chú ngữ pháp + 6–7 bài tập: trắc nghiệm, điền từ,
 *   nghe (máy đọc) và xếp thẻ từ thành câu. Bài ôn tập có thêm câu tự nói/viết (có micro) làm thử thách.
 * - Ngữ pháp tăng dần: to be -> a/an -> have/has -> there is/are -> hiện tại đơn -> tần suất
 *   -> some/any -> hiện tại tiếp diễn -> can -> quá khứ đơn -> so sánh -> be going to.
 *
 * Quy ước: trong mc(...) và listen(...) đáp án đúng luôn đứng ĐẦU danh sách lựa chọn (hàm tự xáo khi seed).
 * v(từ, phiên âm, nghĩa, câu ví dụ, bản dịch câu ví dụ).
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
          grammar: {
            title: "Chào theo thời điểm trong ngày",
            intro:
              "Chọn lời chào theo **buổi**: morning (sáng), afternoon (chiều), evening (tối). *Good night* chỉ dùng để chúc ngủ ngon hoặc chia tay buổi tối muộn.",
            patterns: ["**Good morning / afternoon / evening**, + tên.", "How are you? – I'm fine, **thank you**."],
            examples: [
              { en: "Good morning, Mr Nam.", vi: "Chào buổi sáng thầy Nam." },
              { en: "How are you? – I'm fine, thank you.", vi: "Bạn khỏe không? – Mình khỏe, cảm ơn bạn." },
            ],
            avoid: { wrong: "Good night, everyone! (khi vừa đến lớp buổi tối)", fix: "Vừa gặp nhau thì nói *Good evening*." },
          },
          vocab: [
            v("hello", "/həˈləʊ/", "xin chào", "Hello, I am Lan.", "Xin chào, mình là Lan."),
            v("good morning", "/ɡʊd ˈmɔːnɪŋ/", "chào buổi sáng", "Good morning, Mr Nam.", "Chào buổi sáng thầy Nam."),
            v("good afternoon", "/ɡʊd ˌɑːftəˈnuːn/", "chào buổi chiều", "Good afternoon, class.", "Chào buổi chiều cả lớp."),
            v("good evening", "/ɡʊd ˈiːvnɪŋ/", "chào buổi tối", "Good evening, everyone.", "Chào buổi tối mọi người."),
            v("goodbye", "/ˌɡʊdˈbaɪ/", "tạm biệt", "Goodbye, see you tomorrow.", "Tạm biệt, hẹn gặp lại ngày mai."),
            v("thank you", "/ˈθæŋk juː/", "cảm ơn", "Thank you very much.", "Cảm ơn bạn rất nhiều."),
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
          grammar: {
            title: "Động từ to be: am / is / are",
            intro: "**to be** nghĩa là “là, thì, ở”. Chọn *am*, *is* hay *are* theo chủ ngữ đứng trước.",
            patterns: [
              "I **am** (I'm)",
              "He / She / It **is** (he's, she's, it's)",
              "You / We / They **are** (you're, we're, they're)",
            ],
            examples: [
              { en: "I am a student.", vi: "Tôi là học sinh." },
              { en: "She is from Hanoi.", vi: "Cô ấy đến từ Hà Nội." },
              { en: "We are Vietnamese.", vi: "Chúng tôi là người Việt Nam." },
            ],
            avoid: { wrong: "I is a student.", fix: "Với I luôn dùng *am*: I am a student." },
          },
          vocab: [
            v("name", "/neɪm/", "tên", "My name is Minh.", "Tên tôi là Minh."),
            v("meet", "/miːt/", "gặp", "Nice to meet you.", "Rất vui được gặp bạn."),
            v("from", "/frɒm/", "đến từ", "I am from Hanoi.", "Tôi đến từ Hà Nội."),
            v("country", "/ˈkʌntri/", "đất nước", "Vietnam is a beautiful country.", "Việt Nam là một đất nước xinh đẹp."),
            v("Vietnamese", "/ˌvjetnəˈmiːz/", "người Việt; tiếng Việt", "I am Vietnamese.", "Tôi là người Việt Nam."),
            v("student", "/ˈstjuːdnt/", "học sinh, sinh viên", "I am a student.", "Tôi là học sinh."),
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
          grammar: {
            title: "Hỏi và nói tuổi",
            intro: "Tiếng Anh dùng **be** (am/is/are) để nói tuổi, không dùng *have*.",
            patterns: ["How old **are** you?", "I **am** + số + years old."],
            examples: [
              { en: "I am twenty years old.", vi: "Tôi hai mươi tuổi." },
              { en: "My sister is twelve.", vi: "Em gái tôi mười hai tuổi." },
            ],
            avoid: { wrong: "I have twenty years.", fix: "Có thể bỏ *years old*: I'm twenty." },
          },
          vocab: [
            v("one", "/wʌn/", "số một", "I have one brother.", "Tôi có một anh trai."),
            v("ten", "/ten/", "số mười", "I have ten books.", "Tôi có mười quyển sách."),
            v("twelve", "/twelv/", "số mười hai", "My sister is twelve.", "Em gái tôi mười hai tuổi."),
            v("twenty", "/ˈtwenti/", "số hai mươi", "I am twenty years old.", "Tôi hai mươi tuổi."),
            v("old", "/əʊld/", "(… tuổi); già, cũ", "How old are you?", "Bạn bao nhiêu tuổi?"),
            v("phone number", "/ˈfəʊn ˌnʌmbə(r)/", "số điện thoại", "What is your phone number?", "Số điện thoại của bạn là gì?"),
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
          grammar: {
            title: "Mạo từ a / an",
            intro:
              "Nói nghề nghiệp cần **a/an** trước danh từ số ít. Chọn theo **âm** đầu của từ phía sau, không theo chữ cái.",
            patterns: ["**a** + âm phụ âm: a doctor, a teacher", "**an** + âm nguyên âm: an engineer, an office"],
            examples: [
              { en: "He is a doctor.", vi: "Anh ấy là bác sĩ." },
              { en: "She is an engineer.", vi: "Cô ấy là kỹ sư." },
              { en: "What is your job?", vi: "Bạn làm nghề gì?" },
            ],
            avoid: { wrong: "She is engineer.", fix: "Nói nghề nghiệp phải có a/an: She is *an* engineer." },
          },
          vocab: [
            v("teacher", "/ˈtiːtʃə(r)/", "giáo viên", "My mother is a teacher.", "Mẹ tôi là giáo viên."),
            v("doctor", "/ˈdɒktə(r)/", "bác sĩ", "He is a doctor.", "Anh ấy là bác sĩ."),
            v("engineer", "/ˌendʒɪˈnɪə(r)/", "kỹ sư", "She is an engineer.", "Cô ấy là kỹ sư."),
            v("nurse", "/nɜːs/", "y tá", "My aunt is a nurse.", "Dì tôi là y tá."),
            v("job", "/dʒɒb/", "công việc, nghề", "What is your job?", "Bạn làm nghề gì?"),
            v("office", "/ˈɒfɪs/", "văn phòng", "I work in an office.", "Tôi làm việc ở văn phòng."),
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
          grammar: {
            title: "this / that / these / those và số nhiều",
            intro:
              "**this/these** chỉ vật ở gần, **that/those** chỉ vật ở xa. Danh từ số nhiều thường thêm **-s**; tận cùng -s, -x, -ch, -sh thì thêm **-es**.",
            patterns: [
              "**This is** + 1 vật · **These are** + nhiều vật (ở gần)",
              "**That is** + 1 vật · **Those are** + nhiều vật (ở xa)",
            ],
            examples: [
              { en: "This is my book.", vi: "Đây là quyển sách của tôi." },
              { en: "Those chairs are old.", vi: "Những cái ghế kia cũ rồi." },
              { en: "One box, two boxes.", vi: "Một cái hộp, hai cái hộp." },
            ],
            avoid: { wrong: "These is my bags.", fix: "Nhiều vật thì dùng *are*: These are my bags." },
          },
          vocab: [
            v("book", "/bʊk/", "quyển sách", "This is my book.", "Đây là quyển sách của tôi."),
            v("pen", "/pen/", "cây bút", "That is your pen.", "Kia là cây bút của bạn."),
            v("bag", "/bæɡ/", "cái cặp, cái túi", "These bags are new.", "Những cái túi này còn mới."),
            v("chair", "/tʃeə(r)/", "cái ghế", "Those chairs are old.", "Những cái ghế kia cũ rồi."),
            v("table", "/ˈteɪbl/", "cái bàn", "The book is on the table.", "Quyển sách ở trên bàn."),
            v("window", "/ˈwɪndəʊ/", "cửa sổ", "Open the window, please.", "Làm ơn mở cửa sổ ra."),
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
          grammar: {
            title: "have / has: có",
            intro: "Nói ai đó **có** gì thì dùng have/has. **He / She / It** đi với **has**, các ngôi còn lại dùng **have**.",
            patterns: ["I / You / We / They **have** + …", "He / She / It **has** + …"],
            examples: [
              { en: "I have two brothers.", vi: "Tôi có hai anh trai." },
              { en: "She has one sister.", vi: "Cô ấy có một chị gái." },
            ],
            avoid: { wrong: "She have a brother.", fix: "Chủ ngữ she dùng *has*: She has a brother." },
          },
          vocab: [
            v("mother", "/ˈmʌðə(r)/", "mẹ", "My mother is a nurse.", "Mẹ tôi là y tá."),
            v("father", "/ˈfɑːðə(r)/", "bố", "My father works in an office.", "Bố tôi làm việc ở văn phòng."),
            v("brother", "/ˈbrʌðə(r)/", "anh trai, em trai", "I have two brothers.", "Tôi có hai anh trai."),
            v("sister", "/ˈsɪstə(r)/", "chị gái, em gái", "She has one sister.", "Cô ấy có một chị gái."),
            v("parents", "/ˈpeərənts/", "bố mẹ", "My parents are teachers.", "Bố mẹ tôi là giáo viên."),
            v("grandmother", "/ˈɡrænmʌðə(r)/", "bà", "I love my grandmother.", "Tôi rất yêu bà tôi."),
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
          grammar: {
            title: "Tính từ sở hữu",
            intro:
              "Tính từ sở hữu đứng **trước danh từ**: my (của tôi), your (của bạn), his (của anh ấy), her (của cô ấy), our (của chúng tôi), their (của họ).",
            patterns: [
              "**my / your / his / her / our / their** + danh từ",
              "Danh từ + **be** + tính từ: His hair **is** black.",
            ],
            examples: [
              { en: "Her hair is short.", vi: "Tóc cô ấy ngắn." },
              { en: "Our teacher is young.", vi: "Thầy giáo của chúng tôi còn trẻ." },
              { en: "Their eyes are brown.", vi: "Mắt của họ màu nâu." },
            ],
            avoid: { wrong: "This is Lan. His hair is long.", fix: "Lan là nữ nên dùng *her*: Her hair is long." },
          },
          vocab: [
            v("tall", "/tɔːl/", "cao", "My brother is tall.", "Anh trai tôi cao."),
            v("short", "/ʃɔːt/", "thấp; ngắn", "Her hair is short.", "Tóc cô ấy ngắn."),
            v("young", "/jʌŋ/", "trẻ", "Our teacher is young.", "Thầy giáo của chúng tôi còn trẻ."),
            v("kind", "/kaɪnd/", "tốt bụng", "Your mother is very kind.", "Mẹ bạn rất tốt bụng."),
            v("hair", "/heə(r)/", "tóc", "His hair is black.", "Tóc anh ấy màu đen."),
            v("eyes", "/aɪz/", "đôi mắt", "Their eyes are brown.", "Mắt của họ màu nâu."),
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
          grammar: {
            title: "There is / There are: có …",
            intro: "Dùng **there is / there are** để nói ở một nơi nào đó **có** cái gì.",
            patterns: [
              "**There is** + a/an + danh từ số ít",
              "**There are** + danh từ số nhiều",
              "Câu hỏi: **Is there** …? / **Are there** …?",
            ],
            examples: [
              { en: "There is a bed in the bedroom.", vi: "Có một cái giường trong phòng ngủ." },
              { en: "There are four rooms in my house.", vi: "Nhà tôi có bốn phòng." },
            ],
            avoid: {
              wrong: "In my house have three bedrooms.",
              fix: "Không dịch “có” thành *have* ở đây: There are three bedrooms in my house.",
            },
          },
          vocab: [
            v("house", "/haʊs/", "ngôi nhà", "My house is small.", "Nhà tôi nhỏ."),
            v("room", "/ruːm/", "căn phòng", "There are four rooms in my house.", "Nhà tôi có bốn phòng."),
            v("kitchen", "/ˈkɪtʃɪn/", "nhà bếp", "My mother is in the kitchen.", "Mẹ tôi đang ở trong bếp."),
            v("bedroom", "/ˈbedruːm/", "phòng ngủ", "There is a bed in the bedroom.", "Có một cái giường trong phòng ngủ."),
            v(
              "bathroom",
              "/ˈbɑːθruːm/",
              "phòng tắm",
              "The bathroom is next to my bedroom.",
              "Phòng tắm ở cạnh phòng ngủ của tôi.",
            ),
            v(
              "living room",
              "/ˈlɪvɪŋ ruːm/",
              "phòng khách",
              "We watch TV in the living room.",
              "Chúng tôi xem TV trong phòng khách.",
            ),
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
          grammar: {
            title: "Giới từ chỉ vị trí",
            intro: "Giới từ chỉ vị trí đứng **trước** danh từ chỉ nơi chốn, thường đi sau **be**.",
            patterns: [
              "**in** (trong) · **on** (trên mặt) · **under** (dưới)",
              "**next to** (bên cạnh) · **behind** (phía sau) · **between** A **and** B (ở giữa)",
            ],
            examples: [
              { en: "The cat is in the box.", vi: "Con mèo ở trong hộp." },
              { en: "The shoes are under the bed.", vi: "Đôi giày ở dưới gầm giường." },
              { en: "I sit between Lan and Minh.", vi: "Tôi ngồi giữa Lan và Minh." },
            ],
            avoid: { wrong: "The bank is next the school.", fix: "next to luôn có *to*: next to the school." },
          },
          vocab: [
            v("in", "/ɪn/", "ở trong", "The cat is in the box.", "Con mèo ở trong hộp."),
            v("on", "/ɒn/", "ở trên (bề mặt)", "The book is on the table.", "Quyển sách ở trên bàn."),
            v("under", "/ˈʌndə(r)/", "ở dưới", "The shoes are under the bed.", "Đôi giày ở dưới gầm giường."),
            v("next to", "/ˈnekst tə/", "bên cạnh", "The bank is next to the school.", "Ngân hàng ở cạnh trường học."),
            v("behind", "/bɪˈhaɪnd/", "phía sau", "The garden is behind the house.", "Khu vườn ở phía sau ngôi nhà."),
            v("between", "/bɪˈtwiːn/", "ở giữa", "I sit between Lan and Minh.", "Tôi ngồi giữa Lan và Minh."),
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
          grammar: {
            title: "Vị trí của tính từ chỉ màu",
            intro: "Tính từ (màu sắc) đứng **trước** danh từ, ngược với tiếng Việt, và không thêm -s ở số nhiều.",
            patterns: [
              "a/an + **màu** + danh từ: a red car",
              "Danh từ + be + **màu**: The sky is blue.",
              "Hỏi màu: **What colour is** …? – It's …",
            ],
            examples: [
              { en: "It is a red car.", vi: "Đó là một chiếc ô tô màu đỏ." },
              { en: "The leaves are green.", vi: "Những chiếc lá màu xanh lá." },
              { en: "What colour is your bag? – It's black.", vi: "Cặp của bạn màu gì? – Màu đen." },
            ],
            avoid: { wrong: "I have two cars reds.", fix: "Màu đứng trước danh từ và không thêm -s: two red cars." },
          },
          vocab: [
            v("red", "/red/", "màu đỏ", "The apple is red.", "Quả táo màu đỏ."),
            v("blue", "/bluː/", "màu xanh dương", "The sky is blue.", "Bầu trời màu xanh."),
            v("green", "/ɡriːn/", "màu xanh lá", "The leaves are green.", "Những chiếc lá màu xanh lá."),
            v("yellow", "/ˈjeləʊ/", "màu vàng", "The banana is yellow.", "Quả chuối màu vàng."),
            v("black", "/blæk/", "màu đen", "My cat is black.", "Con mèo của tôi màu đen."),
            v("white", "/waɪt/", "màu trắng", "The wall is white.", "Bức tường màu trắng."),
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
          grammar: {
            title: "Hỏi và nói giờ",
            intro: "Hỏi giờ bằng **What time is it?** Câu trả lời bắt đầu bằng **It is** (It's).",
            patterns: [
              "Giờ đúng: It's + giờ + **o'clock**",
              "Giờ rưỡi: It's **half past** + giờ",
              "15 phút: It's **a quarter past** + giờ (hơn) · **a quarter to** + giờ (kém)",
            ],
            examples: [
              { en: "It is seven o'clock.", vi: "Bây giờ là bảy giờ đúng." },
              { en: "It is half past six.", vi: "Bây giờ là sáu giờ rưỡi." },
              { en: "It is a quarter past eight.", vi: "Bây giờ là tám giờ mười lăm." },
            ],
            avoid: { wrong: "It is six half.", fix: "Sáu giờ rưỡi là *half past six*." },
          },
          vocab: [
            v("o'clock", "/əˈklɒk/", "(… giờ) đúng", "It is seven o'clock.", "Bây giờ là bảy giờ đúng."),
            v("half past", "/hɑːf pɑːst/", "(… giờ) rưỡi", "It is half past six.", "Bây giờ là sáu giờ rưỡi."),
            v(
              "quarter",
              "/ˈkwɔːtə(r)/",
              "mười lăm phút (một phần tư giờ)",
              "It is a quarter past eight.",
              "Bây giờ là tám giờ mười lăm.",
            ),
            v("minute", "/ˈmɪnɪt/", "phút", "Wait a minute, please.", "Làm ơn đợi một phút."),
            v("hour", "/ˈaʊə(r)/", "giờ, tiếng đồng hồ", "I study for one hour.", "Tôi học trong một tiếng."),
            v("time", "/taɪm/", "thời gian; giờ", "What time is it?", "Bây giờ là mấy giờ?"),
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
          grammar: {
            title: "Thì hiện tại đơn: thói quen",
            intro:
              "Dùng thì hiện tại đơn cho **thói quen, việc lặp lại** hằng ngày. Với I / You / We / They, động từ giữ **nguyên mẫu**.",
            patterns: ["I / You / We / They + **động từ nguyên mẫu**", "**at** + giờ: at six o'clock"],
            examples: [
              { en: "I get up at six o'clock.", vi: "Tôi thức dậy lúc sáu giờ." },
              { en: "They go to school by bike.", vi: "Họ đi học bằng xe đạp." },
            ],
            avoid: { wrong: "I getting up at six.", fix: "Thói quen dùng hiện tại đơn: I get up at six." },
          },
          vocab: [
            v("get up", "/ɡet ʌp/", "thức dậy", "I get up at six o'clock.", "Tôi thức dậy lúc sáu giờ."),
            v("have breakfast", "/hæv ˈbrekfəst/", "ăn sáng", "We have breakfast at home.", "Chúng tôi ăn sáng ở nhà."),
            v("go to school", "/ɡəʊ tə skuːl/", "đi học", "They go to school by bike.", "Họ đi học bằng xe đạp."),
            v("go to work", "/ɡəʊ tə wɜːk/", "đi làm", "My parents go to work at seven.", "Bố mẹ tôi đi làm lúc bảy giờ."),
            v("have lunch", "/hæv lʌntʃ/", "ăn trưa", "I have lunch at twelve o'clock.", "Tôi ăn trưa lúc mười hai giờ."),
            v("go to bed", "/ɡəʊ tə bed/", "đi ngủ", "I go to bed at ten.", "Tôi đi ngủ lúc mười giờ."),
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
          grammar: {
            title: "Hiện tại đơn với he / she / it",
            intro:
              "Chủ ngữ **he / she / it** (hoặc một người, một vật) thì động từ thêm **-s/-es**. Câu phủ định và câu hỏi dùng **does**, động từ trở về nguyên mẫu.",
            patterns: [
              "He / She + V**-s**: works, plays · V**-es** sau -ch, -sh, -s, -x, -o: watches, goes",
              "Phụ âm + y → **-ies**: study → studies",
              "Phủ định: **doesn't** + V · Câu hỏi: **Does** + S + V …?",
            ],
            examples: [
              { en: "She lives in Da Nang.", vi: "Cô ấy sống ở Đà Nẵng." },
              { en: "He doesn't like coffee.", vi: "Anh ấy không thích cà phê." },
              { en: "Does she work in an office?", vi: "Cô ấy có làm việc ở văn phòng không?" },
            ],
            avoid: { wrong: "He doesn't likes coffee.", fix: "Sau doesn't, động từ ở nguyên mẫu: He doesn't like coffee." },
          },
          vocab: [
            v("live", "/lɪv/", "sống", "She lives in Da Nang.", "Cô ấy sống ở Đà Nẵng."),
            v("work", "/wɜːk/", "làm việc", "He works in a hospital.", "Anh ấy làm việc ở bệnh viện."),
            v("study", "/ˈstʌdi/", "học", "They study English at school.", "Họ học tiếng Anh ở trường."),
            v("watch", "/wɒtʃ/", "xem", "He watches TV every evening.", "Tối nào anh ấy cũng xem TV."),
            v("play", "/pleɪ/", "chơi", "Nam plays football.", "Nam chơi bóng đá."),
            v("like", "/laɪk/", "thích", "She likes music.", "Cô ấy thích âm nhạc."),
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
          grammar: {
            title: "Trạng từ tần suất",
            intro:
              "always (luôn luôn) → usually → often → sometimes → never (không bao giờ). Trạng từ tần suất đứng **trước động từ thường** và **sau be**.",
            patterns: [
              "S + **always / often …** + động từ thường",
              "S + **be** + always / never …",
              "**every day / every week** thường đứng cuối câu",
            ],
            examples: [
              { en: "I always get up early.", vi: "Tôi luôn dậy sớm." },
              { en: "She is never late.", vi: "Cô ấy không bao giờ đến muộn." },
              { en: "I study English every day.", vi: "Tôi học tiếng Anh mỗi ngày." },
            ],
            avoid: { wrong: "I play often tennis.", fix: "Đặt trạng từ trước động từ thường: I often play tennis." },
          },
          vocab: [
            v("always", "/ˈɔːlweɪz/", "luôn luôn", "I always get up early.", "Tôi luôn dậy sớm."),
            v(
              "usually",
              "/ˈjuːʒuəli/",
              "thường thường",
              "She usually has breakfast at home.",
              "Cô ấy thường ăn sáng ở nhà.",
            ),
            v("often", "/ˈɒfn/", "thường, hay", "We often play football.", "Chúng tôi hay chơi bóng đá."),
            v(
              "sometimes",
              "/ˈsʌmtaɪmz/",
              "thỉnh thoảng",
              "He sometimes goes to school late.",
              "Thỉnh thoảng cậu ấy đi học muộn.",
            ),
            v(
              "never",
              "/ˈnevə(r)/",
              "không bao giờ",
              "My father never drinks coffee.",
              "Bố tôi không bao giờ uống cà phê.",
            ),
            v("every day", "/ˈevri deɪ/", "mỗi ngày", "I study English every day.", "Tôi học tiếng Anh mỗi ngày."),
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
          grammar: {
            title: "Giới từ chỉ thời gian: in / on / at",
            intro: "Ba giới từ hay gặp nhất khi nói về thời gian. Tên thứ trong tuần luôn **viết hoa** chữ cái đầu.",
            patterns: [
              "**at** + giờ: at seven o'clock · at the weekend",
              "**on** + thứ, ngày: on Monday, on Sunday",
              "**in** + buổi, tháng, năm: in the morning, in May",
            ],
            examples: [
              { en: "I go to school on Monday.", vi: "Tôi đi học vào thứ Hai." },
              { en: "The film starts at eight o'clock.", vi: "Bộ phim bắt đầu lúc tám giờ." },
              { en: "We watch TV in the evening.", vi: "Chúng tôi xem TV vào buổi tối." },
            ],
            avoid: { wrong: "I have English class in Monday.", fix: "Thứ trong tuần đi với *on*: on Monday." },
          },
          vocab: [
            v("Monday", "/ˈmʌndeɪ/", "thứ Hai", "I go to school on Monday.", "Tôi đi học vào thứ Hai."),
            v("Saturday", "/ˈsætədeɪ/", "thứ Bảy", "We play football on Saturday.", "Chúng tôi chơi bóng đá vào thứ Bảy."),
            v(
              "Sunday",
              "/ˈsʌndeɪ/",
              "Chủ nhật",
              "My family goes to the park on Sunday.",
              "Gia đình tôi đi công viên vào Chủ nhật.",
            ),
            v(
              "weekend",
              "/ˌwiːkˈend/",
              "cuối tuần",
              "What do you do at the weekend?",
              "Bạn làm gì vào cuối tuần?",
            ),
            v("morning", "/ˈmɔːnɪŋ/", "buổi sáng", "I study in the morning.", "Tôi học vào buổi sáng."),
            v("evening", "/ˈiːvnɪŋ/", "buổi tối", "We watch TV in the evening.", "Chúng tôi xem TV vào buổi tối."),
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
          grammar: {
            title: "Danh từ đếm được và không đếm được",
            intro:
              "Danh từ **đếm được** có số ít, số nhiều (an egg, two apples). Danh từ **không đếm được** (water, milk, rice, bread) không dùng a/an và không thêm -s.",
            patterns: [
              "**a / an** + danh từ đếm được số ít",
              "**some** + danh từ không đếm được hoặc số nhiều",
              "Đếm bằng đơn vị: a glass **of** water, a piece **of** bread",
            ],
            examples: [
              { en: "She eats an egg every morning.", vi: "Sáng nào cô ấy cũng ăn một quả trứng." },
              { en: "Drink some water.", vi: "Uống chút nước đi." },
              { en: "I have two pieces of bread.", vi: "Tôi có hai lát bánh mì." },
            ],
            avoid: { wrong: "Can I have a water and two breads?", fix: "Nói *some water* và *two pieces of bread*." },
          },
          vocab: [
            v("rice", "/raɪs/", "cơm, gạo", "We eat rice every day.", "Chúng tôi ăn cơm mỗi ngày."),
            v("bread", "/bred/", "bánh mì", "I have bread for breakfast.", "Tôi ăn bánh mì vào bữa sáng."),
            v("egg", "/eɡ/", "quả trứng", "She eats an egg every morning.", "Sáng nào cô ấy cũng ăn một quả trứng."),
            v(
              "apple",
              "/ˈæpl/",
              "quả táo",
              "An apple a day is good for you.",
              "Mỗi ngày một quả táo rất tốt cho bạn.",
            ),
            v("water", "/ˈwɔːtə(r)/", "nước", "Drink some water.", "Uống chút nước đi."),
            v("milk", "/mɪlk/", "sữa", "The children drink milk.", "Bọn trẻ uống sữa."),
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
          grammar: {
            title: "some / any và would like",
            intro:
              "**some** dùng trong câu khẳng định và khi mời, xin. **any** dùng trong câu hỏi và câu phủ định. **would like** là cách nói “muốn” lịch sự.",
            patterns: [
              "I **would like** (I'd like) + danh từ / to + V",
              "There is **some** … · Is there **any** …? · There isn't **any** …",
              "Xin lịch sự: **Can I have** …, please?",
            ],
            examples: [
              { en: "I would like a cup of tea.", vi: "Tôi muốn một tách trà." },
              { en: "We don't have any bread.", vi: "Chúng tôi không còn chút bánh mì nào." },
              { en: "Can I have the bill, please?", vi: "Cho tôi xin hóa đơn." },
            ],
            avoid: { wrong: "Give me tea.", fix: "Khi gọi món nên nói lịch sự: I'd like a cup of tea, please." },
          },
          vocab: [
            v("menu", "/ˈmenjuː/", "thực đơn", "Can I see the menu, please?", "Cho tôi xem thực đơn được không?"),
            v("order", "/ˈɔːdə(r)/", "gọi món", "Are you ready to order?", "Anh chị gọi món được chưa ạ?"),
            v("coffee", "/ˈkɒfi/", "cà phê", "A black coffee, please.", "Cho tôi một cà phê đen."),
            v("tea", "/tiː/", "trà", "I would like a cup of tea.", "Tôi muốn một tách trà."),
            v(
              "would like",
              "/wʊd laɪk/",
              "muốn (cách nói lịch sự)",
              "I would like some noodles.",
              "Tôi muốn ăn mì.",
            ),
            v("bill", "/bɪl/", "hóa đơn", "Can I have the bill, please?", "Cho tôi xin hóa đơn."),
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
          grammar: {
            title: "How much / How many",
            intro:
              "**How many** + danh từ đếm được số nhiều để hỏi số lượng. **How much** + danh từ không đếm được, và dùng để **hỏi giá**.",
            patterns: [
              "How **many** + danh từ số nhiều …?",
              "How **much** + danh từ không đếm được …?",
              "Hỏi giá: How much **is** + 1 vật? · How much **are** + nhiều vật?",
            ],
            examples: [
              { en: "How much is this bag?", vi: "Cái túi này giá bao nhiêu?" },
              { en: "How many apples do you want?", vi: "Bạn muốn bao nhiêu quả táo?" },
              { en: "How much are these shoes?", vi: "Đôi giày này giá bao nhiêu?" },
            ],
            avoid: { wrong: "How many money do you have?", fix: "money không đếm được: How much money do you have?" },
          },
          vocab: [
            v("price", "/praɪs/", "giá", "What is the price of this bag?", "Cái túi này giá bao nhiêu?"),
            v("cheap", "/tʃiːp/", "rẻ", "These shoes are cheap.", "Đôi giày này rẻ."),
            v("expensive", "/ɪkˈspensɪv/", "đắt", "The phone is very expensive.", "Chiếc điện thoại rất đắt."),
            v("buy", "/baɪ/", "mua", "I want to buy a new bag.", "Tôi muốn mua một cái túi mới."),
            v("money", "/ˈmʌni/", "tiền", "I don't have much money.", "Tôi không có nhiều tiền."),
            v("shop", "/ʃɒp/", "cửa hàng", "The shop opens at nine o'clock.", "Cửa hàng mở cửa lúc chín giờ."),
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
          grammar: {
            title: "Thì hiện tại tiếp diễn",
            intro: "Dùng cho việc **đang diễn ra** ngay lúc nói (now, at the moment, Look!).",
            patterns: [
              "S + **am / is / are** + V**-ing**",
              "wear → wearing · dance → danc**ing** (bỏ e) · run → ru**nn**ing (gấp đôi phụ âm)",
              "Phủ định: is**n't** / are**n't** + V-ing",
            ],
            examples: [
              { en: "She is wearing a red dress.", vi: "Cô ấy đang mặc một chiếc váy đỏ." },
              { en: "They are playing football at the moment.", vi: "Lúc này họ đang chơi bóng đá." },
              { en: "What are you wearing today?", vi: "Hôm nay bạn mặc gì?" },
            ],
            avoid: { wrong: "She wearing a dress.", fix: "Không được thiếu be: She *is* wearing a dress." },
          },
          vocab: [
            v("shirt", "/ʃɜːt/", "áo sơ mi", "He is wearing a white shirt.", "Anh ấy đang mặc áo sơ mi trắng."),
            v("dress", "/dres/", "váy liền", "She is wearing a red dress.", "Cô ấy đang mặc một chiếc váy đỏ."),
            v("shoes", "/ʃuːz/", "đôi giày", "My shoes are new.", "Đôi giày của tôi còn mới."),
            v("jeans", "/dʒiːnz/", "quần bò", "I usually wear jeans.", "Tôi thường mặc quần bò."),
            v("jacket", "/ˈdʒækɪt/", "áo khoác", "Take your jacket. It is cold.", "Mang áo khoác theo nhé. Trời lạnh đấy."),
            v("wear", "/weə(r)/", "mặc, đeo", "What are you wearing today?", "Hôm nay bạn mặc gì?"),
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
          grammar: {
            title: "can và like + V-ing",
            intro:
              "**can** (có thể, biết) nói về khả năng; sau can là **động từ nguyên mẫu** và can không thêm -s. **like + V-ing** nói về sở thích.",
            patterns: [
              "S + **can / can't** + V",
              "**Can** + S + V …? – Yes, I can. / No, I can't.",
              "S + **like(s)** + V**-ing**",
            ],
            examples: [
              { en: "I can swim.", vi: "Tôi biết bơi." },
              { en: "Can you ride a bike? – No, I can't.", vi: "Bạn biết đi xe đạp không? – Không, tôi không biết." },
              { en: "She likes singing.", vi: "Cô ấy thích hát." },
            ],
            avoid: { wrong: "She cans sings.", fix: "Sau can là động từ nguyên mẫu: She can sing." },
          },
          vocab: [
            v("swim", "/swɪm/", "bơi", "I can swim.", "Tôi biết bơi."),
            v("cook", "/kʊk/", "nấu ăn", "My father can cook very well.", "Bố tôi nấu ăn rất ngon."),
            v("sing", "/sɪŋ/", "hát", "She likes singing.", "Cô ấy thích hát."),
            v("dance", "/dɑːns/", "nhảy, múa", "They can dance.", "Họ biết nhảy."),
            v("draw", "/drɔː/", "vẽ", "My brother likes drawing.", "Em trai tôi thích vẽ."),
            v("ride a bike", "/raɪd ə baɪk/", "đi xe đạp", "Can you ride a bike?", "Bạn có biết đi xe đạp không?"),
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
          grammar: {
            title: "Quá khứ của to be: was / were",
            intro:
              "Nói về trạng thái trong quá khứ (yesterday, last week, … ago): **am / is → was**, **are → were**.",
            patterns: [
              "I / He / She / It **was** …",
              "You / We / They **were** …",
              "Phủ định: wasn't / weren't · Câu hỏi: **Were** you …? / **Was** he …?",
            ],
            examples: [
              { en: "I was at home yesterday.", vi: "Hôm qua tôi ở nhà." },
              { en: "They were tired after work.", vi: "Họ mệt sau giờ làm." },
              { en: "When were you born? – I was born in 2005.", vi: "Bạn sinh năm nào? – Tôi sinh năm 2005." },
            ],
            avoid: { wrong: "I born in 2005.", fix: "Nói năm sinh luôn có *was*: I was born in 2005." },
          },
          vocab: [
            v("yesterday", "/ˈjestədeɪ/", "hôm qua", "I was at home yesterday.", "Hôm qua tôi ở nhà."),
            v("last week", "/lɑːst wiːk/", "tuần trước", "We were in Hue last week.", "Tuần trước chúng tôi ở Huế."),
            v("ago", "/əˈɡəʊ/", "cách đây", "She was a student two years ago.", "Cách đây hai năm cô ấy còn là sinh viên."),
            v("born", "/bɔːn/", "được sinh ra", "I was born in 2005.", "Tôi sinh năm 2005."),
            v("tired", "/ˈtaɪəd/", "mệt", "They were tired after work.", "Họ mệt sau giờ làm."),
            v("happy", "/ˈhæpi/", "vui vẻ", "He was very happy yesterday.", "Hôm qua anh ấy rất vui."),
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
          grammar: {
            title: "Quá khứ đơn: thêm -ed",
            intro:
              "Thì quá khứ đơn dùng cho việc **đã xảy ra và đã kết thúc**. Động từ có quy tắc thêm **-ed**, giống nhau với mọi chủ ngữ.",
            patterns: [
              "V + **-ed**: clean → cleaned · live → live**d** · study → stud**ied**",
              "Phủ định: **didn't** + V nguyên mẫu",
              "Câu hỏi: **Did** + S + V nguyên mẫu …?",
            ],
            examples: [
              { en: "I cleaned my room yesterday.", vi: "Hôm qua tôi đã dọn phòng." },
              { en: "She didn't visit her aunt last week.", vi: "Tuần trước cô ấy không đến thăm dì." },
              { en: "Did you watch TV last night?", vi: "Tối qua bạn có xem TV không?" },
            ],
            avoid: { wrong: "Did you watched TV?", fix: "Sau did, động từ ở nguyên mẫu: Did you watch TV?" },
          },
          vocab: [
            v(
              "visit",
              "/ˈvɪzɪt/",
              "thăm",
              "We visited our grandparents last Sunday.",
              "Chủ nhật tuần trước chúng tôi đã đến thăm ông bà.",
            ),
            v("clean", "/kliːn/", "dọn dẹp, lau chùi", "I cleaned my room yesterday.", "Hôm qua tôi đã dọn phòng."),
            v("stay", "/steɪ/", "ở lại", "They stayed at home last weekend.", "Cuối tuần trước họ ở nhà."),
            v("listen", "/ˈlɪsn/", "nghe", "She listened to music last night.", "Tối qua cô ấy đã nghe nhạc."),
            v("walk", "/wɔːk/", "đi bộ", "He walked to school yesterday.", "Hôm qua cậu ấy đi bộ đến trường."),
            v("last night", "/lɑːst naɪt/", "tối qua", "I watched a film last night.", "Tối qua tôi đã xem một bộ phim."),
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
          grammar: {
            title: "Động từ bất quy tắc",
            intro:
              "Nhiều động từ thông dụng **không thêm -ed** mà có dạng quá khứ riêng, cần học thuộc. Câu phủ định và câu hỏi vẫn dùng **did + nguyên mẫu**.",
            patterns: [
              "go → **went** · eat → **ate** · see → **saw**",
              "buy → **bought** · have → **had** · take → **took**",
              "Phủ định: didn't + **go** (không viết didn't went)",
            ],
            examples: [
              { en: "I went to Hanoi last year.", vi: "Năm ngoái tôi đã đi Hà Nội." },
              { en: "She bought a new dress.", vi: "Cô ấy đã mua một chiếc váy mới." },
              { en: "We didn't eat breakfast.", vi: "Chúng tôi đã không ăn sáng." },
            ],
            avoid: { wrong: "Yesterday I buyed a bag.", fix: "buy là động từ bất quy tắc: Yesterday I bought a bag." },
          },
          vocab: [
            v("went", "/went/", "đã đi (quá khứ của go)", "I went to Hanoi last year.", "Năm ngoái tôi đã đi Hà Nội."),
            v(
              "ate",
              "/eɪt/",
              "đã ăn (quá khứ của eat)",
              "We ate noodles for breakfast.",
              "Bữa sáng chúng tôi đã ăn mì.",
            ),
            v(
              "saw",
              "/sɔː/",
              "đã thấy, đã xem (quá khứ của see)",
              "I saw a good film yesterday.",
              "Hôm qua tôi đã xem một bộ phim hay.",
            ),
            v("bought", "/bɔːt/", "đã mua (quá khứ của buy)", "She bought a new dress.", "Cô ấy đã mua một chiếc váy mới."),
            v("had", "/hæd/", "đã có, đã ăn (quá khứ của have)", "We had a great time.", "Chúng tôi đã có khoảng thời gian rất vui."),
            v("took", "/tʊk/", "đã lấy, đã chụp (quá khứ của take)", "He took many photos.", "Anh ấy đã chụp rất nhiều ảnh."),
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
          grammar: {
            title: "So sánh hơn và so sánh nhất",
            intro:
              "Tính từ **ngắn** (1 âm tiết) thêm -er / -est; tính từ **dài** dùng more / the most. Một số tính từ đặc biệt: good → better → the best.",
            patterns: [
              "So sánh hơn: tall**er** than · **more** beautiful than",
              "So sánh nhất: **the** tall**est** · **the most** beautiful",
              "big → bi**gg**er (gấp đôi phụ âm) · happy → happ**ier**",
            ],
            examples: [
              { en: "A car is faster than a bike.", vi: "Ô tô nhanh hơn xe đạp." },
              { en: "This is the smallest room.", vi: "Đây là căn phòng nhỏ nhất." },
              { en: "She is the best student in my class.", vi: "Cô ấy là học sinh giỏi nhất lớp tôi." },
            ],
            avoid: { wrong: "A plane is more fast than a car.", fix: "Tính từ ngắn không dùng more: faster than." },
          },
          vocab: [
            v("big", "/bɪɡ/", "to, lớn", "An elephant is bigger than a horse.", "Con voi to hơn con ngựa."),
            v("small", "/smɔːl/", "nhỏ", "This is the smallest room.", "Đây là căn phòng nhỏ nhất."),
            v("fast", "/fɑːst/", "nhanh", "A car is faster than a bike.", "Ô tô nhanh hơn xe đạp."),
            v("beautiful", "/ˈbjuːtɪfl/", "đẹp", "Ha Long Bay is very beautiful.", "Vịnh Hạ Long rất đẹp."),
            v("good", "/ɡʊd/", "tốt, giỏi", "She is a good student.", "Cô ấy là một học sinh giỏi."),
            v("than", "/ðæn/", "hơn (dùng khi so sánh)", "My brother is taller than me.", "Anh trai tôi cao hơn tôi."),
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
          grammar: {
            title: "be going to: kế hoạch, dự định",
            intro: "Nói về **kế hoạch đã định** trong tương lai (tomorrow, next week, next month).",
            patterns: [
              "S + **am / is / are going to** + V nguyên mẫu",
              "Phủ định: S + am / is / are **not** going to + V",
              "Câu hỏi: **What are you going to** do …?",
            ],
            examples: [
              { en: "I am going to buy a train ticket.", vi: "Tôi định mua vé tàu." },
              { en: "We are going to visit Da Lat next month.", vi: "Tháng sau chúng tôi sẽ đi Đà Lạt." },
              { en: "What are you going to do tomorrow?", vi: "Ngày mai bạn định làm gì?" },
            ],
            avoid: { wrong: "We going to travel.", fix: "Cần đủ be và to: We are going to travel." },
          },
          vocab: [
            v("travel", "/ˈtrævl/", "đi du lịch", "I love to travel.", "Tôi rất thích đi du lịch."),
            v("ticket", "/ˈtɪkɪt/", "vé", "I am going to buy a train ticket.", "Tôi định mua vé tàu."),
            v("hotel", "/həʊˈtel/", "khách sạn", "We are going to stay in a hotel.", "Chúng tôi định ở khách sạn."),
            v(
              "beach",
              "/biːtʃ/",
              "bãi biển",
              "They are going to swim at the beach.",
              "Họ định đi bơi ở bãi biển.",
            ),
            v(
              "tomorrow",
              "/təˈmɒrəʊ/",
              "ngày mai",
              "What are you going to do tomorrow?",
              "Ngày mai bạn định làm gì?",
            ),
            v(
              "next",
              "/nekst/",
              "tới, kế tiếp",
              "We are going to visit Da Lat next month.",
              "Tháng sau chúng tôi sẽ đi Đà Lạt.",
            ),
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
