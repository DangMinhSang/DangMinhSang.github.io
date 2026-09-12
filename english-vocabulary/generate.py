#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
generate.py - English Vocabulary Data Generator
================================================

HOW TO ADD A SENTENCE
---------------------
1. Open this file.
2. Find the `sentences` list below.
3. Add a new dictionary entry following the template:

    {
        "english": "Your English sentence here.",
        "vietnamese": "Bản dịch tiếng Việt ở đây.",
        "keywords": ["keyword1", "keyword2"],   # Main vocabulary to focus on
        "difficulty": "B1",                     # CEFR level: A1, A2, B1, B2, C1, C2
        "topic": "Daily Life",                  # See TOPICS list below for valid values
        "note": ""                              # Optional grammar note or explanation
    },

4. Save this file.
5. Run: python generate.py
6. The file data.json will be updated automatically.

VALID DIFFICULTY LEVELS (CEFR):
    A1, A2, B1, B2, C1, C2

VALID TOPICS (add more as needed):
    Daily Life, Education, Technology, Travel, Work,
    Health, Food, Nature, Culture, Sports, Business,
    Science, Art, Society, Politics, Economy

REQUIRED FIELDS:     english, vietnamese, difficulty, topic
OPTIONAL FIELDS:     keywords (default: []), note (default: "")
"""

import json
import os
import sys
from pathlib import Path

# ===========================================================================
# CONFIGURATION
# ===========================================================================
OUTPUT_FILE = Path(__file__).parent / "data.json"

VALID_DIFFICULTIES = {"A1", "A2", "B1", "B2", "C1", "C2"}
REQUIRED_FIELDS = {"english", "vietnamese", "difficulty", "topic"}

# ===========================================================================
# DATA SOURCE
# Edit the list below to add or update sentences.
# ===========================================================================

sentences = [
    # ── Daily Life ───────────────────────────────────────────────────────────
    {
        "english": "I have a new bicycle.",
        "vietnamese": "Tôi có một chiếc xe đạp mới.",
        "keywords": ["have", "new", "bicycle"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Simple present – have"
    },
    {
        "english": "She is cooking dinner.",
        "vietnamese": "Chị ấy đang nấu bữa tối.",
        "keywords": ["cooking", "dinner"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Present continuous"
    },
    {
        "english": "Can we go to the movies tonight?",
        "vietnamese": "Chúng ta có thể đi xem phim vào tối nay không?",
        "keywords": ["can", "go", "movies", "tonight"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Modal: can – question form"
    },
    {
        "english": "They live in a small house.",
        "vietnamese": "Họ sống ở một ngôi nhà nhỏ.",
        "keywords": ["live", "small", "house"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": ""
    },
    {
        "english": "He is studying English every day.",
        "vietnamese": "Anh ấy đang học tiếng Anh mỗi ngày.",
        "keywords": ["studying", "English", "every day"],
        "difficulty": "A1",
        "topic": "Education",
        "note": "Present continuous"
    },
    {
        "english": "Do you like playing football?",
        "vietnamese": "Bạn có thích chơi bóng đá không?",
        "keywords": ["like", "playing", "football"],
        "difficulty": "A1",
        "topic": "Sports",
        "note": "like + gerund"
    },
    {
        "english": "I have already had breakfast.",
        "vietnamese": "Tôi đã ăn sáng rồi.",
        "keywords": ["already", "had", "breakfast"],
        "difficulty": "A2",
        "topic": "Daily Life",
        "note": "Present perfect with already"
    },
    {
        "english": "She is reading a very interesting book.",
        "vietnamese": "Cô ấy đang đọc một cuốn sách rất thú vị.",
        "keywords": ["reading", "interesting", "book"],
        "difficulty": "A1",
        "topic": "Education",
        "note": "Present continuous"
    },
    {
        "english": "My mother usually goes to work at seven o'clock in the morning.",
        "vietnamese": "Mẹ tôi thường đi làm lúc 7 giờ sáng.",
        "keywords": ["usually", "goes to work", "seven o'clock"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Adverb of frequency: usually"
    },
    {
        "english": "We will go to the park this weekend.",
        "vietnamese": "Chúng tôi sẽ đến công viên vào cuối tuần này.",
        "keywords": ["will", "park", "this weekend"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Future simple: will"
    },
    {
        "english": "It is very sunny today.",
        "vietnamese": "Hôm nay trời rất nắng.",
        "keywords": ["sunny", "today"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Weather expression"
    },
    {
        "english": "He doesn't like eating vegetables.",
        "vietnamese": "Anh ấy không thích ăn rau.",
        "keywords": ["doesn't like", "eating", "vegetables"],
        "difficulty": "A1",
        "topic": "Food",
        "note": "Negative simple present"
    },
    {
        "english": "I am doing my homework.",
        "vietnamese": "Tôi đang làm bài tập về nhà của mình.",
        "keywords": ["doing", "homework"],
        "difficulty": "A1",
        "topic": "Education",
        "note": "Present continuous"
    },
    {
        "english": "She wants to travel to Japan.",
        "vietnamese": "Cô ấy muốn đi du lịch đến Nhật Bản.",
        "keywords": ["wants", "travel", "Japan"],
        "difficulty": "A2",
        "topic": "Travel",
        "note": "want + to infinitive"
    },
    {
        "english": "Can you help me with this exercise?",
        "vietnamese": "Bạn có thể giúp tôi với bài tập này không?",
        "keywords": ["can", "help", "exercise"],
        "difficulty": "A1",
        "topic": "Education",
        "note": "Modal: can – request"
    },
    {
        "english": "I usually drink tea in the morning.",
        "vietnamese": "Tôi thường uống trà vào buổi sáng.",
        "keywords": ["usually", "drink", "tea", "morning"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Adverb of frequency: usually"
    },
    {
        "english": "My cat is sleeping on the sofa.",
        "vietnamese": "Con mèo của tôi đang ngủ trên ghế sofa.",
        "keywords": ["cat", "sleeping", "sofa"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Present continuous"
    },
    {
        "english": "What time will we meet?",
        "vietnamese": "Chúng ta sẽ gặp nhau lúc mấy giờ?",
        "keywords": ["what time", "will", "meet"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Future simple – question"
    },
    {
        "english": "She likes listening to music while working.",
        "vietnamese": "Cô ấy thích nghe nhạc khi làm việc.",
        "keywords": ["likes", "listening", "music", "while working"],
        "difficulty": "A2",
        "topic": "Daily Life",
        "note": "like + gerund; while + gerund"
    },
    {
        "english": "He is waiting for the bus.",
        "vietnamese": "Anh ấy đang chờ xe buýt.",
        "keywords": ["waiting", "bus"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Present continuous; wait for"
    },
    {
        "english": "I want to learn how to cook.",
        "vietnamese": "Tôi muốn học cách nấu ăn.",
        "keywords": ["want", "learn", "cook"],
        "difficulty": "A1",
        "topic": "Food",
        "note": "want + to infinitive; how to"
    },
    {
        "english": "Do you like playing guitar?",
        "vietnamese": "Bạn có thích chơi guitar không?",
        "keywords": ["like", "playing", "guitar"],
        "difficulty": "A1",
        "topic": "Sports",
        "note": "like + gerund"
    },
    {
        "english": "He usually reads books in the evening.",
        "vietnamese": "Anh ấy thường đọc sách vào buổi tối.",
        "keywords": ["usually", "reads", "books", "evening"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Adverb of frequency: usually"
    },
    {
        "english": "My mother is a good cook.",
        "vietnamese": "Mẹ tôi là một đầu bếp giỏi.",
        "keywords": ["mother", "good cook"],
        "difficulty": "A1",
        "topic": "Food",
        "note": ""
    },
    {
        "english": "We will go on a picnic tomorrow.",
        "vietnamese": "Chúng ta sẽ đi dã ngoại vào ngày mai.",
        "keywords": ["will", "picnic", "tomorrow"],
        "difficulty": "A1",
        "topic": "Travel",
        "note": "Future simple: will"
    },
    {
        "english": "Have you ever been to Paris?",
        "vietnamese": "Bạn đã từng đến Paris chưa?",
        "keywords": ["have", "ever", "been", "Paris"],
        "difficulty": "A2",
        "topic": "Travel",
        "note": "Present perfect with ever"
    },
    {
        "english": "I don't know how to fix a computer.",
        "vietnamese": "Tôi không biết cách sửa máy tính.",
        "keywords": ["don't know", "fix", "computer"],
        "difficulty": "A2",
        "topic": "Technology",
        "note": "how to + verb"
    },
    {
        "english": "Yesterday's test was very difficult.",
        "vietnamese": "Bài kiểm tra hôm qua rất khó.",
        "keywords": ["test", "yesterday", "difficult"],
        "difficulty": "A1",
        "topic": "Education",
        "note": "Simple past – to be"
    },
    {
        "english": "I usually wake up at six o'clock in the morning.",
        "vietnamese": "Tôi thường thức dậy lúc 6 giờ sáng.",
        "keywords": ["wake up", "six o'clock", "morning"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Adverb of frequency: usually"
    },
    {
        "english": "Can you recommend a good coffee shop to me?",
        "vietnamese": "Bạn có thể giới thiệu cho tôi một quán cà phê tốt không?",
        "keywords": ["recommend", "good", "coffee shop"],
        "difficulty": "A2",
        "topic": "Daily Life",
        "note": "recommend + noun phrase"
    },
    {
        "english": "I like walking in the morning.",
        "vietnamese": "Tôi thích đi bộ vào buổi sáng.",
        "keywords": ["like", "walking", "morning"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "like + gerund"
    },
    {
        "english": "They are planning a big party.",
        "vietnamese": "Họ đang lên kế hoạch cho một bữa tiệc lớn.",
        "keywords": ["planning", "big", "party"],
        "difficulty": "A2",
        "topic": "Daily Life",
        "note": "Present continuous"
    },
    {
        "english": "I need to learn more English vocabulary.",
        "vietnamese": "Tôi cần học thêm từ vựng tiếng Anh.",
        "keywords": ["need", "learn", "vocabulary"],
        "difficulty": "A1",
        "topic": "Education",
        "note": "need + to infinitive"
    },
    {
        "english": "Can you tell me the address of this restaurant?",
        "vietnamese": "Bạn có thể cho tôi biết địa chỉ của nhà hàng này không?",
        "keywords": ["tell", "address", "restaurant"],
        "difficulty": "A2",
        "topic": "Daily Life",
        "note": "tell + person + noun phrase"
    },
    {
        "english": "She will work here for three months.",
        "vietnamese": "Cô ấy sẽ làm việc ở đây trong ba tháng.",
        "keywords": ["will", "work", "three months"],
        "difficulty": "A2",
        "topic": "Work",
        "note": "Future simple: will + duration"
    },
    {
        "english": "I have never seen snow.",
        "vietnamese": "Tôi chưa bao giờ thấy tuyết.",
        "keywords": ["have never", "seen", "snow"],
        "difficulty": "A2",
        "topic": "Daily Life",
        "note": "Present perfect with never"
    },
    {
        "english": "How many pairs of shoes do you have?",
        "vietnamese": "Bạn có bao nhiêu đôi giày?",
        "keywords": ["how many", "pairs", "shoes"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "How many + plural noun"
    },
    {
        "english": "I think this movie is very interesting.",
        "vietnamese": "Tôi nghĩ rằng bộ phim này rất thú vị.",
        "keywords": ["think", "movie", "interesting"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "think + that clause"
    },
    {
        "english": "He is cleaning the house.",
        "vietnamese": "Anh ấy đang dọn dẹp nhà cửa.",
        "keywords": ["cleaning", "house"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Present continuous"
    },
    {
        "english": "Have you ever eaten sushi?",
        "vietnamese": "Bạn đã bao giờ ăn sushi chưa?",
        "keywords": ["have", "ever", "eaten", "sushi"],
        "difficulty": "A2",
        "topic": "Food",
        "note": "Present perfect with ever"
    },
    {
        "english": "We need to prepare for the exam.",
        "vietnamese": "Chúng tôi cần chuẩn bị cho kỳ thi.",
        "keywords": ["need", "prepare", "exam"],
        "difficulty": "A2",
        "topic": "Education",
        "note": "need + to infinitive"
    },
    {
        "english": "My father is working at a big company.",
        "vietnamese": "Bố tôi đang làm việc tại một công ty lớn.",
        "keywords": ["father", "working", "big company"],
        "difficulty": "A1",
        "topic": "Work",
        "note": "Present continuous"
    },
    {
        "english": "I will go to bed early tonight.",
        "vietnamese": "Tôi sẽ đi ngủ sớm tối nay.",
        "keywords": ["will", "go to bed", "early", "tonight"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Future simple: will"
    },
    {
        "english": "What gift should we buy for mom?",
        "vietnamese": "Chúng ta nên mua quà gì cho mẹ?",
        "keywords": ["what", "gift", "should", "buy"],
        "difficulty": "A2",
        "topic": "Daily Life",
        "note": "Modal: should – question"
    },
    {
        "english": "Have you seen my cat?",
        "vietnamese": "Bạn đã thấy con mèo của tôi chưa?",
        "keywords": ["have", "seen", "cat"],
        "difficulty": "A2",
        "topic": "Daily Life",
        "note": "Present perfect – question"
    },
    {
        "english": "I want to visit the museum at the weekend.",
        "vietnamese": "Tôi muốn đến thăm bảo tàng vào cuối tuần.",
        "keywords": ["want", "visit", "museum", "weekend"],
        "difficulty": "A1",
        "topic": "Travel",
        "note": "want + to infinitive"
    },
    {
        "english": "They are talking about the new project.",
        "vietnamese": "Họ đang nói về dự án mới.",
        "keywords": ["talking", "about", "project"],
        "difficulty": "A2",
        "topic": "Work",
        "note": "Present continuous; talk about"
    },
    {
        "english": "Can you drive a car?",
        "vietnamese": "Bạn có thể lái xe ô tô không?",
        "keywords": ["can", "drive", "car"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Modal: can – ability"
    },
    {
        "english": "I haven't had lunch yet.",
        "vietnamese": "Tôi chưa ăn trưa.",
        "keywords": ["haven't", "lunch", "yet"],
        "difficulty": "A2",
        "topic": "Food",
        "note": "Present perfect with yet"
    },
    {
        "english": "They will get married next month.",
        "vietnamese": "Họ sẽ kết hôn vào tháng sau.",
        "keywords": ["will", "get married", "next month"],
        "difficulty": "A2",
        "topic": "Daily Life",
        "note": "Future simple: will"
    },
    {
        "english": "I bought a new jacket yesterday.",
        "vietnamese": "Tôi đã mua một chiếc áo khoác mới hôm qua.",
        "keywords": ["bought", "jacket", "yesterday"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Simple past: buy → bought"
    },
    {
        "english": "I really love the sea.",
        "vietnamese": "Tôi rất thích biển.",
        "keywords": ["really", "love", "sea"],
        "difficulty": "A1",
        "topic": "Travel",
        "note": ""
    },
    {
        "english": "How many friends do you have at school?",
        "vietnamese": "Bạn có bao nhiêu bạn bè ở trường?",
        "keywords": ["how many", "friends", "school"],
        "difficulty": "A1",
        "topic": "Education",
        "note": "How many + plural noun"
    },
    {
        "english": "I will wait for you in front of the school gate.",
        "vietnamese": "Tôi sẽ đợi bạn ở trước cổng trường.",
        "keywords": ["will", "wait for", "school gate"],
        "difficulty": "A2",
        "topic": "Education",
        "note": "Future simple: will; wait for"
    },
    {
        "english": "We need to plan for the trip.",
        "vietnamese": "Chúng ta cần lên kế hoạch cho chuyến du lịch.",
        "keywords": ["need", "plan", "trip"],
        "difficulty": "A2",
        "topic": "Travel",
        "note": "need + to infinitive"
    },
    {
        "english": "He usually goes to work by bicycle.",
        "vietnamese": "Anh ấy thường đi làm bằng xe đạp.",
        "keywords": ["usually", "goes to work", "bicycle"],
        "difficulty": "A1",
        "topic": "Work",
        "note": "Adverb of frequency: usually; by + transport"
    },
    {
        "english": "She has written a book about history.",
        "vietnamese": "Cô ấy đã viết một cuốn sách về lịch sử.",
        "keywords": ["has written", "book", "history"],
        "difficulty": "A2",
        "topic": "Education",
        "note": "Present perfect: write → written"
    },
    {
        "english": "I don't have time to watch TV.",
        "vietnamese": "Tôi không có thời gian để xem TV.",
        "keywords": ["don't have", "time", "watch TV"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "have time + to infinitive"
    },
    {
        "english": "Do you like watching cartoons?",
        "vietnamese": "Bạn có thích xem phim hoạt hình không?",
        "keywords": ["like", "watching", "cartoons"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "like + gerund"
    },
    {
        "english": "I want to buy a gift for you.",
        "vietnamese": "Tôi muốn mua một món quà cho bạn.",
        "keywords": ["want", "buy", "gift"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "want + to infinitive"
    },
    {
        "english": "I need to drink water right now.",
        "vietnamese": "Tôi cần uống nước ngay bây giờ.",
        "keywords": ["need", "drink", "water", "right now"],
        "difficulty": "A1",
        "topic": "Health",
        "note": "need + to infinitive"
    },
    {
        "english": "Do you want to play volleyball?",
        "vietnamese": "Bạn có muốn chơi bóng chuyền không?",
        "keywords": ["want", "play", "volleyball"],
        "difficulty": "A1",
        "topic": "Sports",
        "note": "want + to infinitive"
    },
    {
        "english": "We will visit our grandparents this weekend.",
        "vietnamese": "Chúng ta sẽ đến thăm ông bà vào cuối tuần này.",
        "keywords": ["will", "visit", "grandparents", "weekend"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Future simple: will"
    },
    {
        "english": "He bought a new car last week.",
        "vietnamese": "Anh ấy đã mua một chiếc xe mới tuần trước.",
        "keywords": ["bought", "new car", "last week"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Simple past: buy → bought"
    },
    {
        "english": "I have never been to Saigon.",
        "vietnamese": "Tôi chưa bao giờ đến Sài Gòn.",
        "keywords": ["have never", "been", "Saigon"],
        "difficulty": "A2",
        "topic": "Travel",
        "note": "Present perfect with never"
    },
    {
        "english": "Can you show me how to make this dish?",
        "vietnamese": "Bạn có thể chỉ cho tôi cách làm món này không?",
        "keywords": ["show", "how to make", "dish"],
        "difficulty": "A2",
        "topic": "Food",
        "note": "show + person + how to"
    },
    {
        "english": "I have watched this movie three times.",
        "vietnamese": "Tôi đã xem bộ phim này ba lần rồi.",
        "keywords": ["have watched", "movie", "three times"],
        "difficulty": "A2",
        "topic": "Daily Life",
        "note": "Present perfect + number of times"
    },
    {
        "english": "They are studying in the library.",
        "vietnamese": "Họ đang học trong thư viện.",
        "keywords": ["studying", "library"],
        "difficulty": "A1",
        "topic": "Education",
        "note": "Present continuous"
    },
    {
        "english": "Do you remember my birthday?",
        "vietnamese": "Bạn có nhớ ngày sinh nhật của tôi không?",
        "keywords": ["remember", "birthday"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": ""
    },
    {
        "english": "I like eating ice cream in summer.",
        "vietnamese": "Tôi thích ăn kem vào mùa hè.",
        "keywords": ["like", "eating", "ice cream", "summer"],
        "difficulty": "A1",
        "topic": "Food",
        "note": "like + gerund"
    },
    {
        "english": "What are you thinking about?",
        "vietnamese": "Bạn đang nghĩ gì vậy?",
        "keywords": ["what", "thinking about"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Present continuous – question"
    },
    {
        "english": "I usually drink coffee in the morning.",
        "vietnamese": "Tôi thường uống cà phê vào buổi sáng.",
        "keywords": ["usually", "drink", "coffee", "morning"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Adverb of frequency: usually"
    },
    {
        "english": "Are you free today?",
        "vietnamese": "Hôm nay bạn có rảnh không?",
        "keywords": ["free", "today"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": ""
    },
    {
        "english": "She has lived here for five years.",
        "vietnamese": "Cô ấy đã sống ở đây được 5 năm.",
        "keywords": ["has lived", "here", "five years"],
        "difficulty": "A2",
        "topic": "Daily Life",
        "note": "Present perfect + duration: for"
    },
    {
        "english": "Can you call a taxi for me?",
        "vietnamese": "Bạn có thể gọi taxi giúp tôi không?",
        "keywords": ["can", "call", "taxi"],
        "difficulty": "A1",
        "topic": "Travel",
        "note": "Modal: can – request"
    },
    {
        "english": "I have finished cooking dinner.",
        "vietnamese": "Tôi đã nấu bữa tối xong.",
        "keywords": ["have finished", "cooking", "dinner"],
        "difficulty": "A2",
        "topic": "Food",
        "note": "Present perfect: finish + gerund"
    },
    {
        "english": "We should travel in winter.",
        "vietnamese": "Chúng ta nên đi du lịch vào mùa đông.",
        "keywords": ["should", "travel", "winter"],
        "difficulty": "A1",
        "topic": "Travel",
        "note": "Modal: should – suggestion"
    },
    {
        "english": "He is very good at playing piano.",
        "vietnamese": "Anh ấy rất giỏi chơi piano.",
        "keywords": ["good at", "playing", "piano"],
        "difficulty": "A2",
        "topic": "Sports",
        "note": "good at + gerund"
    },
    {
        "english": "Have you ever traveled by plane?",
        "vietnamese": "Bạn đã từng đi máy bay chưa?",
        "keywords": ["have", "ever", "traveled", "plane"],
        "difficulty": "A2",
        "topic": "Travel",
        "note": "Present perfect with ever; by + transport"
    },
    {
        "english": "I will call you later.",
        "vietnamese": "Tôi sẽ gọi điện cho bạn sau.",
        "keywords": ["will", "call", "later"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Future simple: will"
    },
    {
        "english": "She is working at a large hospital.",
        "vietnamese": "Cô ấy đang làm việc ở một bệnh viện lớn.",
        "keywords": ["working", "large", "hospital"],
        "difficulty": "A1",
        "topic": "Health",
        "note": "Present continuous"
    },
    {
        "english": "I need to buy some food.",
        "vietnamese": "Tôi cần mua một số thực phẩm.",
        "keywords": ["need", "buy", "food"],
        "difficulty": "A1",
        "topic": "Food",
        "note": "need + to infinitive"
    },
    {
        "english": "Can you help me do this exercise?",
        "vietnamese": "Bạn có thể giúp tôi làm bài tập này không?",
        "keywords": ["can", "help", "exercise"],
        "difficulty": "A1",
        "topic": "Education",
        "note": "help + person + bare infinitive"
    },
    {
        "english": "We will go to the cinema tonight.",
        "vietnamese": "Chúng ta sẽ đi xem phim vào tối nay.",
        "keywords": ["will", "cinema", "tonight"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Future simple: will"
    },
    {
        "english": "I won't be able to attend your party.",
        "vietnamese": "Tôi sẽ không thể đến dự tiệc của bạn.",
        "keywords": ["won't", "able to", "attend", "party"],
        "difficulty": "A2",
        "topic": "Daily Life",
        "note": "Negative future: won't be able to"
    },
    {
        "english": "He likes listening to classical music.",
        "vietnamese": "Anh ấy thích nghe nhạc cổ điển.",
        "keywords": ["likes", "listening", "classical music"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "like + gerund"
    },
    {
        "english": "Have you finished the project?",
        "vietnamese": "Bạn đã hoàn thành dự án chưa?",
        "keywords": ["have", "finished", "project"],
        "difficulty": "A2",
        "topic": "Work",
        "note": "Present perfect – question"
    },
    {
        "english": "I like taking a nap after lunch.",
        "vietnamese": "Tôi thích ngủ trưa sau bữa ăn trưa.",
        "keywords": ["like", "taking a nap", "after lunch"],
        "difficulty": "A2",
        "topic": "Daily Life",
        "note": "like + gerund"
    },
    {
        "english": "They are learning how to speak Spanish.",
        "vietnamese": "Họ đang học cách nói tiếng Tây Ban Nha.",
        "keywords": ["learning", "how to speak", "Spanish"],
        "difficulty": "A2",
        "topic": "Education",
        "note": "Present continuous; how to + verb"
    },
    {
        "english": "I will go shopping tomorrow.",
        "vietnamese": "Tôi sẽ đi mua sắm vào ngày mai.",
        "keywords": ["will", "shopping", "tomorrow"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Future simple: will"
    },
    {
        "english": "Can you take a photo of me?",
        "vietnamese": "Bạn có thể chụp ảnh cho tôi không?",
        "keywords": ["can", "take a photo"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Modal: can – request"
    },
    {
        "english": "I used to work in a restaurant.",
        "vietnamese": "Tôi đã từng làm việc trong một nhà hàng.",
        "keywords": ["used to", "work", "restaurant"],
        "difficulty": "A2",
        "topic": "Work",
        "note": "used to + verb – past habit"
    },
    {
        "english": "Do you know how to make pho?",
        "vietnamese": "Bạn có biết cách làm món phở không?",
        "keywords": ["know", "how to make", "pho"],
        "difficulty": "A2",
        "topic": "Food",
        "note": "know + how to + verb"
    },
    {
        "english": "She bought a new dress yesterday.",
        "vietnamese": "Cô ấy đã mua một cái váy mới hôm qua.",
        "keywords": ["bought", "new dress", "yesterday"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Simple past: buy → bought"
    },
    {
        "english": "I will go to English class this afternoon.",
        "vietnamese": "Tôi sẽ đến lớp học tiếng Anh vào chiều nay.",
        "keywords": ["will", "English class", "this afternoon"],
        "difficulty": "A1",
        "topic": "Education",
        "note": "Future simple: will"
    },
    {
        "english": "Have you read this book?",
        "vietnamese": "Bạn đã đọc cuốn sách này chưa?",
        "keywords": ["have", "read", "book"],
        "difficulty": "A2",
        "topic": "Education",
        "note": "Present perfect – question"
    },
    {
        "english": "I like walking in the park.",
        "vietnamese": "Tôi thích đi bộ trong công viên.",
        "keywords": ["like", "walking", "park"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "like + gerund"
    },
    {
        "english": "Have you had lunch yet?",
        "vietnamese": "Bạn đã ăn trưa chưa?",
        "keywords": ["have", "lunch", "yet"],
        "difficulty": "A2",
        "topic": "Food",
        "note": "Present perfect with yet – question"
    },
    {
        "english": "He is watching TV in the living room.",
        "vietnamese": "Anh ấy đang xem TV trong phòng khách.",
        "keywords": ["watching", "TV", "living room"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Present continuous"
    },
    {
        "english": "I will meet you tomorrow morning.",
        "vietnamese": "Tôi sẽ gặp bạn vào sáng mai.",
        "keywords": ["will", "meet", "tomorrow morning"],
        "difficulty": "A1",
        "topic": "Daily Life",
        "note": "Future simple: will"
    },
]

# ===========================================================================
# VALIDATION & GENERATION LOGIC — do not edit below unless needed
# ===========================================================================

def validate_sentence(sentence: dict, index: int) -> list[str]:
    """Return a list of error messages for the given sentence entry."""
    errors = []

    # Check required fields
    for field in REQUIRED_FIELDS:
        if field not in sentence:
            errors.append(f"  [#{index}] Missing required field: '{field}'")
        elif not isinstance(sentence[field], str):
            errors.append(f"  [#{index}] Field '{field}' must be a string")
        elif not sentence[field].strip():
            errors.append(f"  [#{index}] Field '{field}' must not be empty")

    # Check difficulty
    if "difficulty" in sentence and sentence["difficulty"] not in VALID_DIFFICULTIES:
        errors.append(
            f"  [#{index}] Invalid difficulty '{sentence['difficulty']}'. "
            f"Must be one of: {', '.join(sorted(VALID_DIFFICULTIES))}"
        )

    # Check keywords is a list of strings (optional field)
    if "keywords" in sentence:
        if not isinstance(sentence["keywords"], list):
            errors.append(f"  [#{index}] Field 'keywords' must be a list")
        elif not all(isinstance(k, str) for k in sentence["keywords"]):
            errors.append(f"  [#{index}] All items in 'keywords' must be strings")

    return errors


def normalize_sentence(sentence: dict, index: int) -> dict:
    """Return a normalized, schema-complete sentence dict."""
    return {
        "id": index,
        "english": sentence["english"].strip(),
        "vietnamese": sentence["vietnamese"].strip(),
        "keywords": sentence.get("keywords", []),
        "difficulty": sentence["difficulty"].strip(),
        "topic": sentence["topic"].strip(),
        "note": sentence.get("note", "").strip(),
    }


def generate():
    print("=" * 50)
    print("English Vocabulary — Data Generator")
    print("=" * 50)

    # Validate all entries first
    all_errors = []
    for i, sentence in enumerate(sentences):
        all_errors.extend(validate_sentence(sentence, i + 1))

    if all_errors:
        print("\n❌ Validation failed. Please fix the following errors:\n")
        for err in all_errors:
            print(err)
        print(f"\nTotal errors: {len(all_errors)}")
        sys.exit(1)

    # Normalize and assign IDs
    normalized = [normalize_sentence(s, i + 1) for i, s in enumerate(sentences)]

    # Build metadata
    topics = sorted(set(s["topic"] for s in normalized))
    difficulties = sorted(set(s["difficulty"] for s in normalized),
                          key=lambda d: ["A1", "A2", "B1", "B2", "C1", "C2"].index(d))

    output = {
        "meta": {
            "total": len(normalized),
            "topics": topics,
            "difficulties": difficulties,
            "generated_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
            "version": "1.0"
        },
        "sentences": normalized
    }

    # Write to file
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Generated {OUTPUT_FILE.name} successfully.")
    print(f"   Total sentences : {len(normalized)}")
    print(f"   Topics          : {', '.join(topics)}")
    print(f"   Difficulties    : {', '.join(difficulties)}")
    print()


if __name__ == "__main__":
    generate()
