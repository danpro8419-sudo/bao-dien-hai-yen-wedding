window.WEDDING_CONFIG = {
  groom: "Bảo Điền",
  bride: "Hải Yến",
  weddingDate: "2027-01-03T07:00:00+07:00",
  theNightBefore: false,

  // Publishable key: an toàn để dùng ở frontend. KHÔNG đặt service_role/secret key ở đây.
  supabase: {
    url: "https://ijdtbdldkqorosukjqry.supabase.co",
    publishableKey: "sb_publishable_UvBKvBA6Xwnb2ZFZzS_uNA_LBMP676F"
  },


  // ÂM THANH:
  // Trình duyệt điện thoại thường chặn autoplay có tiếng trước tương tác đầu tiên.
  // Web sẽ thử phát khi mở link; nếu bị chặn, nhạc sẽ tự bắt đầu ở lần chạm đầu tiên.
  audio: {
    enabled: true,
    openingInstrumental: "audio/opening-instrumental.mp3",
    vowAudio: "audio/vow-intro.mp3",
    openingVolume: 0.20,
    vowVolume: 0.86,
    playlistVolume: 0.28,
    maxPlaylistTracks: 3,

    // Thêm/bớt file tùy ý. Mỗi lượt khách chỉ phát ngẫu nhiên tối đa 3 bài.
    playlist: [
      "audio/playlist-01.mp3",
      "audio/playlist-02.mp3",
      "audio/playlist-03.mp3",
      "audio/playlist-04.mp3",
      "audio/playlist-05.mp3"
    ],

    // Các câu này sẽ xuất hiện bên trái trong lúc file vow-intro.mp3 phát.
    vowLines: [
      "Từ những ngày rất đỗi bình thường, chúng con đã tìm thấy nhau.",
      "Chúng con hứa sẽ cùng nhau đi qua những ngày vui, những ngày khó khăn và những điều chưa biết trước.",
      "Từ hôm nay, hai hành trình sẽ trở thành một mái nhà."
    ]
  },

  // LỊCH TRÌNH:
  // Nếu chưa chốt giờ, để showTimeline: false để ẩn toàn bộ timeline.
  // Từng nghi lễ cũng có thể tắt riêng bằng enabled: false.
  schedule: {
    showTimeline: false,
    events: {
      xinDau:         { enabled: true,  time: "" },
      giaTienNhaGai:  { enabled: true,  time: "" },
      giaTienNhaTrai: { enabled: true,  time: "" },
      leNhaTho:       { enabled: true,  time: "" },
      tiecNhaGai:     { enabled: true,  time: "" },
      tiecNhaTrai:    { enabled: true,  time: "" }
    }
  },

  locations: {
    brideHome: { name: "NHÀ GÁI", address: "", mapUrl: "" },
    groomHome: { name: "NHÀ TRAI", address: "", mapUrl: "" },
    church: { name: "NHÀ THỜ", address: "", mapUrl: "" },
    reception: { name: "TIỆC TỐI", address: "", mapUrl: "" }
  }
};
