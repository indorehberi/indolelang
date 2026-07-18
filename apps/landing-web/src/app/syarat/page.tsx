"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function SyaratPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <main className="max-w-[1000px] mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-heading-xl font-black text-on-surface leading-tight font-serif">
            SYARAT DAN KETENTUAN LELANG
          </h1>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-outline-variant/20 shadow-sm space-y-6 text-on-surface-variant text-body-md leading-relaxed">
          <p>
            Syarat dan Ketentuan yang ditetapkan dibawah ini mengatur mengenai lelang yang diinformasikan dan diadakan melalui situs web www.bidku.co.id atau aplikasi milik BIDKU. Syarat dan Ketentuan ini merupakan kesepakatan yang sah serta berlaku mengikat antara BIDKU dengan seluruh Pengguna. Pengguna disarankan untuk membaca dengan seksama karena dapat berdampak kepada hak dan kewajibannya secara hukum.
          </p>

          <section>
            <h2 className="text-heading-md font-bold text-on-surface font-serif mt-6 mb-3">1. Definisi</h2>
            <ul className="space-y-2">
              <li><strong>1.1.</strong> Aplikasi adalah perangkat lunak yang dimiliki oleh BIDKU dan dapat digunakan oleh Pengguna dengan tujuan mengikuti Lelang secara daring (online).</li>
              <li><strong>1.2.</strong> BIDKU adalah PT INDO LELANG SEJAHTERA , badan hukum berbentuk perseroan terbatas (PT) yang melakukan kegiatan usaha sebagai balai lelang.</li>
              <li><strong>1.3.</strong> Pengguna adalah pihak yang mengakses situs web www.bidku.co.id, Aplikasi BIDKU atau pihak yang menggunakan layanan BIDKU.</li>
              <li><strong>1.4.</strong> Lelang adalah proses menjual dan membeli unit yang diselenggarakan oleh BIDKU dengan cara menawarkan kepada Peserta Lelang. Peserta Lelang diberi kesempatan untuk memberikan penawaran harga lebih tinggi dan peserta dengan penawaran tertinggi dalam jangka waktu yang telah ditentukan akan diberi hak untuk membeli kendaraan.</li>
              <li><strong>1.5.</strong> Objek Lelang adalah seluruh unit yang akan dijual melalui proses lelang.</li>
              <li><strong>1.6.</strong> Unit Reguler adalah seluruh kendaraan bermotor selain Unit Salvage dan Unit Alat Berat yang akan dijual melalui proses lelang.</li>
              <li><strong>1.7.</strong> Unit Salvage adalah seluruh kendaraan bermotor roda empat yang ditanggung oleh perusahaan asuransi (salvage) yang akan dijual melalui proses lelang.</li>
              <li><strong>1.8.</strong> Unit Alat Berat adalah seluruh unit selain Unit Reguler dan Unit Salvage yang akan dijual melalui proses lelang.</li>
              <li><strong>1.9.</strong> Penjual adalah pihak yang berdasarkan peraturan perundang-undangan atau perjanjian memiliki hak dan berwenang untuk menjual barang secara lelang.</li>
              <li><strong>1.10.</strong> Peserta Lelang adalah pihak perseorangan, badan usaha, atau badan hukum yang telah memenuhi syarat yang ditetapkan oleh BIDKU untuk ikut serta dalam lelang.</li>
              <li><strong>1.11.</strong> Tempat Pelaksanaan Lelang adalah tempat BIDKU menyelenggarakan lelang sesuai informasi yang ada pada Katalog.</li>
              <li><strong>1.12.</strong> Pemenang Lelang adalah pihak yang memberikan penawaran tertinggi dan ditetapkan sebagai pemenang/pembeli atas objek lelang oleh Pejabat lelang.</li>
              <li><strong>1.13.</strong> Open House adalah periode pengecekan unit dan Dokumen Kepemilikan Objek Lelang.</li>
              <li><strong>1.14.</strong> Pejabat Lelang adalah orang yang berdasarkan peraturan perundang-undangan diberi wewenang khusus untuk melaksanakan penjualan barang secara lelang.</li>
              <li><strong>1.15.</strong> Harga Terbentuk adalah harga penawaran tertinggi yang diajukan oleh Peserta Lelang yang telah disahkan sebagai pemenang lelang oleh Pejabat Lelang.</li>
              <li><strong>1.16.</strong> Dokumen Kepemilikan adalah Bukti Kepemilikan Kendaraan Bermotor (BPKB), Surat Tanda Nomor Kendaraan (STNK) atas Unit Reguler dan Unit Salvage, dan dokumen Faktur dan Invoice atas Unit Alat Berat.</li>
              <li><strong>1.17.</strong> NIPL adalah Nomor Induk Peserta Lelang.</li>
              <li><strong>1.18.</strong> Hari Kerja adalah hari kerja BIDKU yaitu Senin sampai dengan Jumat pukul 09.00 – 18.00 WIB kecuali dinyatakan sebagai hari libur nasional oleh Pemerintah.</li>
              <li><strong>1.19.</strong> Force Majeure adalah keadaan/peristiwa yang terjadi diluar dari kuasa/kontrol BIDKU dan/atau Penjual yang memiliki dampak langsung pada proses pelaksanaan Lelang dan/atau terjadi pada tempat pelaksanaan lelang / tempat penyimpanan objek lelang, termasuk namun tidak terbatas pada :
                <ul className="list-[lower-alpha] pl-6 mt-1 space-y-1">
                  <li>Kerusuhan, huru-hara;</li>
                  <li>Peperangan yang diumumkan oleh Pemerintah;</li>
                  <li>Kebakaran dan ledakan yang bukan diakibatkan oleh kelalaian BIDKU atau pun Penjual;</li>
                  <li>Bencana alam seperti gempa bumi, tsunami, badai, banjir;</li>
                  <li>Perubahan dalam kebijakan Pemerintah atau undang-undang;</li>
                  <li>Peristiwa/keadaan lain yang tidak dapat dihindari atau diprediksi yang menyebabkan terjadinya penundaan/penghentian proses lelang atau perubahan pada keadaan fisik objek lelang.</li>
                </ul>
              </li>
              <li><strong>1.20.</strong> Katalog adalah kumpulan informasi/data mengenai Objek Lelang dan syarat ketentuan mengikuti lelang yang diinformasikan BIDKU kepada Peserta Lelang secara tertulis baik melalui aplikasi, situs web BIDKU atau secara fisik pada Tempat Pelaksanaan Lelang.</li>
              <li><strong>1.21.</strong> Lembar Data Kendaraan adalah informasi/data mengenai Objek Lelang yang ada pada setiap Objek Lelang dan dapat dilihat oleh Peserta Lelang pada saat Open House sebagai panduan.</li>
              <li><strong>1.22.</strong> Blacklist adalah sanksi yang diberikan oleh BIDKU kepada Peserta Lelang sehingga Peserta Lelang tidak dapat mengikuti lelang yang diadakan oleh BIDKU.</li>
              <li><strong>1.23.</strong> Rekondisi adalah tindakan untuk membuat Objek Lelang menjadi lebih baik dengan mengubah, memperbaiki atau mengganti bagian tertentu.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-md font-bold text-on-surface font-serif mt-6 mb-3">2. Ketentuan Sebelum Lelang</h2>
            <ul className="space-y-4">
              <li>
                <strong>2.1. Pendaftaran</strong>
                <ul className="list-[lower-alpha] pl-6 mt-1 space-y-1">
                  <li>Pengguna atau calon Peserta Lelang yang ingin mengikuti proses lelang wajib melakukan pendaftaran baik melalui Aplikasi ataupun langsung pada meja pendaftaran yang ada pada Tempat Pelaksanaan Lelang.</li>
                  <li>Calon Peserta Lelang yang mendaftarkan diri wajib melampirkan identitas sesuai yang dipersyaratkan, BIDKU berhak untuk menolak ataupun membatalkan pendaftaran dari calon Peserta Lelang sebagaimana keputusan sepihak dari BIDKU.</li>
                </ul>
              </li>
              <li>
                <strong>2.2. Deposit</strong>
                <ul className="list-[lower-alpha] pl-6 mt-1 space-y-2">
                  <li>Peserta Lelang yang akan mengikuti lelang wajib menempatkan Deposit.</li>
                  <li>
                    Ketentuan deposit non-member
                    <ul className="list-[lower-roman] pl-6 mt-1 space-y-1">
                      <li>Deposit untuk setiap Objek Lelang yang hendak dimenangkan, sebesar :
                        <ul className="list-disc pl-6 mt-1">
                          <li>Rp. 5.000.000,- (lima juta rupiah) per 1 (satu) Unit Reguler (mobil) dan Unit Salvage</li>
                          <li>Rp. 10.000.000,- (sepuluh juta rupiah) per 1 (satu) Unit Alat Berat</li>
                          <li>Rp. 1.000.000,- (satu juta rupiah) per 1 (satu) Unit Reguler (motor)</li>
                        </ul>
                      </li>
                      <li>Nilai deposit yang telah disetorkan akan menjadi nilai pengurang atas pembayaran pelunasan (jika Peserta Lelang memenangkan lelang). Akumulasi nilai deposit (apabila Peserta Lelang mengikuti beberapa lelang) seluruhnya dapat digunakan menjadi pengurang pelunasan jika lelang dilakukan pada hari dan di cabang BIDKU yang sama.</li>
                      <li>Jika Peserta Lelang tidak memenangkan lelang, maka deposit akan dikembalikan tanpa potongan apapun dengan cara pemindah bukuan (transfer) dalam jangka waktu selambat-lambatnya 5 (lima) hari kerja setelah tanggal lelang atau sesuai batas waktu yang ditentukan oleh BIDKU melalui pemberitahuan tertulis.</li>
                      <li>Uang deposit akan dikembalikan melalui nomor rekening Peserta Lelang yang terdaftar dalam sistem BIDKU.</li>
                    </ul>
                  </li>
                  <li>Ketentuan deposit bagi member sesuai dengan nilai dan ketentuan yang tercantum pada Syarat dan Ketentuan Membership pada situs web www.bidku.co.id atau Aplikasi BIDKU.</li>
                </ul>
              </li>
              <li>
                <strong>2.3. NIPL</strong>
                <ul className="list-[lower-alpha] pl-6 mt-1 space-y-1">
                  <li>Peserta Lelang yang telah melakukan pendaftaran pada akun www.bidku.co.id atau Aplikasi BIDKU dan telah menempatkan deposit berhak untuk mengikuti proses Lelang baik secara online maupun offline. BIDKU akan memberikan NIPL bagi setiap Peserta Lelang sebagai tanda identifikasi dari Peserta Lelang.</li>
                  <li>Bagi Peserta Lelang yang hadir langsung di lokasi lelang dan telah mendaftarkan diri serta menempatkan deposit akan menerima papan NIPL pada hari lelang, yang mana NIPL tersebut akan digunakan selama proses lelang dan dikembalikan kepada BIDKU setelah lelang selesai.</li>
                  <li>Peserta Lelang yang kehilangan papan NIPL wajib membayar denda sebesar Rp 100.000,- (seratus ribu rupiah) kepada BIDKU.</li>
                </ul>
              </li>
              <li>
                <strong>2.4. Open House</strong>
                <ul className="list-[lower-alpha] pl-6 mt-1 space-y-1">
                  <li>BIDKU akan mengadakan Open House pada setiap Objek Lelang yang bertujuan untuk memberikan kesempatan bagi Calon Peserta Lelang untuk melakukan pengecekan Dokumen Kepemilikan serta keadaan fisik atas Objek Lelang dalam keadaan tidak bergerak (statis). Untuk Unit Salvage dan Unit Alat Berat , BIDKU akan menampilkan foto fisik dan informasi mengenai Objek Lelang pada Katalog di website BIDKU yang dapat diakses Peserta Lelang menggunakan username dan password yang telah diterimanya.</li>
                  <li>Waktu dan tempat Open House akan diinformasikan pada Katalog Objek Lelang yang ada pada situs web atau Aplikasi BIDKU. Untuk Unit Salvage, Peserta Lelang yang akan datang ke lokasi Open House wajib terlebih dahulu memberikan konfirmasi kepada Person In Charge (PIC) Open House yang tercantum pada Katalog.</li>
                  <li>Open House berhak diikuti oleh seluruh Peserta Lelang dan Peserta Lelang diharapkan memeriksa baik Objek Lelang beserta dengan Dokumen Kepemilikan, sehingga dengan diadakannya Open House Peserta Lelang dianggap telah memahami dan mengerti atas segala keadaan dari Objek Lelang dan dianggap telah mengetahui serta menerima seluruh kondisi Objek Lelang.</li>
                  <li>Setiap Peserta Lelang yang hendak mengikuti Open House wajib menukarkan kartu identitas berupa KTP atau SIM kepada security dengan kartu pengunjung dan wajib menaruh barang bawaan ke dalam loker yang disediakan oleh BIDKU untuk mengurangi resiko kehilangan barang dalam area Open House.</li>
                  <li>Dalam hal Peserta Lelang mengikuti Open House yang diselenggarakan oleh BIDKU, Peserta Lelang harus bertanggung jawab penuh atas keselamatan dirinya sendiri. BIDKU tidak bertanggung jawab atas risiko yang timbul atas kelalaian dari Peserta Lelang selama mengikuti Open House.</li>
                </ul>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-md font-bold text-on-surface font-serif mt-6 mb-3">3. Tata Cara Lelang / Ketentuan Saat Lelang</h2>
            <ul className="space-y-2">
              <li><strong>3.1.</strong> Peserta Lelang setuju bahwa seluruh Objek Lelang dan layanan yang diberikan oleh BIDKU &quot;SEBAGAIMANA ADANYA&quot; dan &quot;SEBAGAIMANA TERSEDIA&quot;, sehingga segala risiko yang timbul akibat penggunaan layanan BIDKU termasuk transaksi yang dilakukan melalui BIDKU adalah tanggung jawab dari Peserta Lelang sendiri.</li>
              <li><strong>3.2.</strong> Waktu pelaksanaan lelang dapat dilihat oleh Peserta Lelang pada katalog Objek Lelang yang ada pada situs web www.bidku.co.id atau Aplikasi BIDKU.</li>
              <li><strong>3.3.</strong> Lelang akan dilakukan dengan beberapa metode, yaitu :
                <ul className="pl-6 mt-1 space-y-1">
                  <li>3.3.1. online sepenuhnya; atau</li>
                  <li>3.3.2. penggabungan antara online dan offline (hybrid);atau</li>
                  <li>3.3.3. metode lain yang akan dikomunikasikan dan disepakati dikemudian hari. Terhadap metode yang digunakan akan menjadi hak prerogatif dari BIDKU.</li>
                </ul>
                <p className="mt-2">Lelang akan dibuka dengan harga dasar yang ditentukan dan akan ditutup dengan harga terbentuk yang merupakan penawaran tertinggi dari Peserta Lelang selama periode lelang. Peserta Lelang yang memberikan penawaran tertinggi ditetapkan sebagai Pemenang Lelang.</p>
              </li>
              <li><strong>3.4.</strong> Penawaran lelang dilakukan dengan sistem naik-naik dari Peserta Lelang dengan kelipatan:
                <ul className="list-[lower-alpha] pl-6 mt-1 space-y-1">
                  <li>a. Rp. 500.000,- (lima ratus ribu rupiah) untuk Unit Reguler (mobil) dan Unit Salvage</li>
                  <li>b. Rp. 100.000,- (seratus ribu rupiah) untuk Unit Reguler (motor)</li>
                  <li>c. Rp. 1.000.000,- (satu juta rupiah) untuk Unit Alat Berat</li>
                </ul>
              </li>
              <li><strong>3.5.</strong> Peserta Lelang dianggap melakukan penawaran lelang secara sadar dan tanpa paksaan dari pihak manapun sehingga penawaran Lelang bersifat mengikat dan sah.</li>
              <li><strong>3.6.</strong> Pengesahan Pemenang Lelang bersifat final dan tidak dapat diganggu gugat.</li>
              <li><strong>3.7.</strong> Segala bentuk tindakan yang dilakukan oleh Peserta Lelang dan/atau Pemenang Lelang yang mengganggu dan/atau berpotensi mengganggu operasional BIDKU dapat dikenakan sanksi Blacklist sesuai dengan ketentuan yang berlaku di BIDKU.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-md font-bold text-on-surface font-serif mt-6 mb-3">4. Ketentuan Setelah Lelang</h2>
            <ul className="space-y-4">
              <li>
                <strong>4.1. Pengecekan Objek Lelang</strong>
                <ul className="list-[lower-alpha] pl-6 mt-1 space-y-1">
                  <li>Pemenang Lelang berhak melakukan pengecekan terhadap Objek Lelang yang dimenangkan sebelum melakukan pelunasan dengan batasan waktu maksimal 1 (satu) Hari Kerja setelah tanggal penutupan Lelang. Apabila melewati batas waktu tersebut, Pemenang Lelang tidak lagi berhak melakukan pengecekan terhadap Objek Lelang.</li>
                  <li>Sebelum melakukan pengecekan, Pemenang Lelang wajib terlebih dulu menghubungi tim BIDKU.</li>
                  <li>Jika setelah melakukan pengecekan atas Objek Lelang, Pemenang Lelang memutuskan untuk tidak melanjutkan pelunasan, maka Pemenang Lelang dinyatakan wanprestasi (kemenangannya batal) dan wajib membayar denda berupa uang deposit yang telah dibayarkan (deposit dianggap hangus).</li>
                </ul>
              </li>
              <li>
                <strong>4.2. Biaya Administrasi Lelang</strong>
                <ul className="list-[lower-alpha] pl-6 mt-1 space-y-1">
                  <li>Pemenang lelang wajib membayar biaya administrasi lelang:
                    <ul className="list-[upper-roman] pl-6 mt-1 space-y-1">
                      <li>Unit Reguler (mobil) sebesar 0,6 % (nol koma enam persen) per unit dari Harga Terbentuk jika Harga Terbentuk diatas Rp. 500.000.000,- (lima ratus juta rupiah). Apabila Harga Terbentuk tidak mencapai Rp. 500.000.000,- (lima ratus juta rupiah), maka biaya administrasi lelang yang dibayarkan oleh Pemenang Lelang adalah sebesar Rp. 3.000.000 (tiga juta rupiah) per unit.</li>
                      <li>Unit Reguler (motor) sebesar Rp 1.750.000 (satu juta tujuh ratus lima puluh ribu rupiah) per unit dari Harga Terbentuk jika Harga Terbentuk diatas Rp. 50.000.000 (lima puluh juta rupiah). Apabila harga terbentuk tidak mencapai Rp. 50.000.000,- (lima puluh juta rupiah), maka biaya administrasi lelang yang dibayarkan oleh Pemenang Lelang adalah sebesar Rp 750.000,- (tujuh ratus lima puluh ribu rupiah) per unit.</li>
                      <li>Unit Alat Berat sebesar Rp. 5.000.000,- (lima juta rupiah) per unit untuk unit dengan Harga Terbentuk maksimal Rp. 500.000.000,- (lima ratus juta rupiah) dan biaya administrasi sebesar 1% dari harga terbentuk unit di atas Rp 500.000.000,- (lima ratus juta rupiah).</li>
                      <li>Unit Salvage sebesar 0,6 % (nol koma enam persen) per unit dari Harga Terbentuk jika harga terbentuk diatas Rp. 500.000.000. Apabila Harga Terbentuk tidak mencapai Rp. 500.000.000,- (lima ratus juta rupiah) maka biaya administrasi lelang yang dibayarkan oleh Pemenang Lelang adalah sebesar Rp. 3.000.000 (tiga juta rupiah) per unit.</li>
                    </ul>
                  </li>
                  <li>Biaya administrasi lelang wajib dibayarkan Pemenang Lelang bersamaan dengan pembayaran Harga Terbentuk.</li>
                  <li>Biaya administrasi lelang yang telah dibayarkan oleh Pemenang Lelang tidak dapat dikembalikan oleh karena apapun juga kecuali terjadi penolakan keadaan fisik dan klaim atas Dokumen Kepemilikan atas Objek Lelang sebagaimana diatur dalam 4.5, dimana keputusan atas pengembalian biaya administrasi lelang sepenuhnya adalah kebijakan dari BIDKU.</li>
                </ul>
              </li>
              <li>
                <strong>4.3. Pembayaran Lelang</strong>
                <ul className="list-[lower-alpha] pl-6 mt-1 space-y-1">
                  <li>Pemenang Lelang wajib melunasi total harga terbentuk berikut biaya administrasi lelang dan biaya lain-lain (apabila ada) selambat-lambatnya 5 (lima) Hari Kerja terhitung sejak tanggal lelang atau sesuai batas waktu yang ditentukan oleh BIDKU melalui pemberitahuan tertulis. (Balai Lelang berhak untuk melakukan penyesuaian atas waktu pembayaran dengan memberikan pemberitahuan terlebih dahulu).</li>
                  <li>Jika Pemenang Lelang tidak melunasi pembayaran dalam waktu yang telah ditetapkan, maka Pemenang Lelang dinyatakan wanprestasi (kemenangannya batal) dan wajib membayar denda sejumlah uang deposit yang telah dibayarkan (deposit dianggap hangus).</li>
                  <li>Peserta Lelang dapat masuk kategori Blacklist jika tidak dapat melunasi pembayaran dan biaya denda yang timbul akibat keterlambatan pembayaran, ataupun berdasarkan ketentuan lain yang diatur oleh BIDKU.</li>
                  <li>Dalam hal terdapat kelebihan pembayaran oleh Pemenang Lelang, maka BIDKU akan mengembalikan kelebihan tersebut dalam jangka waktu 7 (tujuh) Hari Kerja sejak pengajuan kelebihan pembayaran diterima BIDKU.</li>
                </ul>
              </li>
              <li>
                <strong>4.4. Pengambilan dan Serah Terima Objek Lelang</strong>
                <ul className="list-[lower-alpha] pl-6 mt-1 space-y-1">
                  <li>Objek lelang yang telah dimenangkan oleh Pemenang Lelang wajib diambil oleh Pemenang Lelang pada tempat Objek Lelang tersebut berada yang telah diinformasikan pada Katalog selambat-lambatnya 7 Hari Kerja untuk Unit Reguler, 5 Hari Kerja untuk Unit Salvage dan Unit Alat Berat setelah tanggal lelang. Pengambilan ini hanya dapat dilakukan setelah Pemenang Lelang melaksanakan kewajiban pembayaran harga terbentuk, biaya administrasi dan biaya lainnya (apabila ada) kepada BIDKU.</li>
                  <li>Apabila setelah masa waktu pengambilan terlewati namun Pemenang Lelang tidak mengambil Objek Lelang tersebut, maka Pemenang Lelang wajib membayar biaya penitipan Objek Lelang sebesar:
                    <ul className="list-[lower-roman] pl-6 mt-1 space-y-1">
                      <li>Rp. 25.000,- (dua puluh lima ribu rupiah) per Unit Reguler (motor) untuk setiap hari keterlambatan.</li>
                      <li>Rp. 50.000,- (lima puluh ribu rupiah) per Unit Reguler (mobil) dan Unit Salvage untuk setiap hari keterlambatan.</li>
                      <li>Rp. 200.000,- (dua ratus ribu rupiah) per Unit Alat Berat untuk setiap hari keterlambatan.</li>
                    </ul>
                    <p className="mt-1">Dalam hal ini BIDKU tidak bertanggung jawab atas adanya perubahan pada fisik, kerusakan, kehilangan atau risiko lain atas Objek Lelang. Apabila terjadi keterlambatan pengambilan, Objek Lelang hanya dapat diambil setelah Pemenang Lelang melunasi seluruh biaya penitipan yang timbul.</p>
                  </li>
                  <li>Dokumen Kepemilikan dan Berita Acara Pemenang Lelang (BAPL) akan diberikan oleh BIDKU kepada Pemenang Lelang saat pelunasan harga terbentuk atau pengambilan unit di kantor BIDKU yang melaksanakan lelang sebagaimana tercantum pada Katalog Objek Lelang.</li>
                  <li>Pengambilan Objek Lelang, Dokumen Kepemilikan, dan BAPL yang dilakukan oleh pihak lain (kuasa/perwakilan dari Pemenang Lelang) wajib melampirkan Surat Kuasa yang bermeterai dan ditandatangani oleh pemberi serta penerima kuasa dengan melampirkan kartu identitas dari kedua belah pihak.</li>
                  <li>Pemenang Lelang/kuasanya wajib menandatangani Berita Acara Serah Terima (BAST) pada saat pengambilan Dokumen Kepemilikan, Objek Lelang dan BAPL.</li>
                  <li>Dokumen Kepemilikan Objek Lelang dapat dikirimkan oleh BIDKU ke alamat Pemenang Lelang dengan mengikuti syarat dan ketentuan pengiriman dokumen yang diatur oleh BIDKU.</li>
                  <li>Biaya pemindahan Objek Lelang dan pengurusan balik nama pada dokumen kepemilikan merupakan tanggung jawab dan beban dari Pemenang Lelang.</li>
                  <li>Objek Lelang yang sudah diambil oleh Pemenang Lelang tidak diperkenankan untuk dititipkan kembali atau diperbaiki di lokasi BIDKU dengan alasan apa pun.</li>
                  <li>Segala perubahan kondisi Objek Lelang yang terjadi setelah Objek Lelang diambil oleh Pemenang Lelang sepenuhnya menjadi tanggung jawab Pemenang Lelang dan bukan merupakan tanggung jawab BIDKU.</li>
                </ul>
              </li>
              <li>
                <strong>4.5. Penolakan Keadaan Fisik dan Klaim Dokumen Kepemilikan</strong>
                <ul className="list-[lower-alpha] pl-6 mt-1 space-y-1">
                  <li>Pemenang Lelang dapat mengajukan penolakan terhadap keadaan fisik Objek Lelang apabila pada saat pengambilan/serah terima terdapat perbedaan keadaan fisik dengan keadaan fisik saat Open House. Perbedaan keadaan fisik ini tidak termasuk perbedaan atau perubahan yang disebabkan oleh proses alamiah (seperti korosi, perubahan karena cuaca, dan proses alami lainnnya) atau keadaan Force Majeure.</li>
                  <li>Penolakan terhadap keadaan fisik Objek Lelang tidak dapat diterima apabila BAST telah ditandatangani oleh Pemenang Lelang dan/atau Objek Lelang telah dipindahkan oleh Pemenang Lelang dan untuk Unit Salvage penolakan terhadap keadaan fisik Objek Lelang tidak dapat diterima apabila pengambilan atau serah terima dilakukan setelah lewat jangka waktu pengambilan Objek Lelang yaitu 5 (lima) Hari Kerja.</li>
                  <li>Pemenang Lelang diwajibkan untuk melakukan pengecekan Dokumen Kepemilikan sebelum melakukan Rekondisi terhadap Objek Lelang. Segala biaya yang timbul atas Rekondisi terhadap Objek Lelang menjadi tanggung jawab Pemenang Lelang.</li>
                  <li>Pemenang Lelang berhak untuk mengajukan klaim atas Dokumen Kepemilikan dengan ketentuan sebagai berikut :
                    <ul className="list-[lower-roman] pl-6 mt-1 space-y-1">
                      <li>Untuk Unit Reguler dan Unit Alat Berat Klaim atas nomor rangka dan nomor mesin dapat diajukan selambat-lambatnya 30 hari kalender sejak tanggal penutupan Lelang.</li>
                      <li>Klaim atas sengketa dan/atau terkait Dokumen Kepemilikan dapat diajukan selambat-lambatnya 90 (sembilan puluh) hari kalender sejak tanggal lelang, apabila dapat dibuktikan secara nyata bahwa Objek Lelang dalam sengketa dan/atau Dokumen Kepemilikan atas Objek Lelang dinyatakan:
                        <ul className="list-disc pl-6 mt-1">
                          <li>Dalam keadaan blokir</li>
                          <li>Palsu</li>
                          <li>Merupakan duplikat</li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                  <li>Selama masa pengajuan klaim, Pemenang Lelang diharapkan memeriksa keadaan dan BPKB Objek Lelang dengan baik, apabila ditemukan hal yang menjadi sebab pengajuan klaim setelah masa klaim berakhir maka BIDKU tidak bertanggung jawab atas hal tersebut.</li>
                  <li>Klaim atas keterlambatan penyerahan BPKB oleh BIDKU hanya dapat diproses bilamana sudah melebihi waktu yang tertulis pada Lembar Data Kendaraan maupun Katalog sesuai ketentuan yang berlaku dari BIDKU.</li>
                  <li>Penolakan dan/atau klaim diajukan melalui BIDKU sebagai kuasa dari Penjual.</li>
                  <li>BIDKU berhak menolak klaim yang diajukan oleh Pemenang Lelang apabila klaim tidak memenuhi syarat klaim yang diatur dalam Syarat dan Ketentuan ini atau ketentuan lain yang diinformasikan sebelum lelang dimulai.</li>
                </ul>
              </li>
              <li>
                <strong>4.6.</strong> Peserta Lelang dan/ atau Pemenang Lelang yang melakukan exit member saat dalam proses pemeriksaan kepolisian atau proses hukum tetap terikat pada ketentuan deposit yang mengendap selama 6 (enam) bulan. Seluruh poin keanggotaan yang dimiliki akan otomatis hangus dan tidak dapat diproses atau ditukarkan kembali
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-md font-bold text-on-surface font-serif mt-6 mb-3">5. Rekening Pembayaran</h2>
            <ul className="space-y-2">
              <li><strong>5.1.</strong> Seluruh pembayaran sehubungan dengan pelaksanaan Lelang baik deposit, pelunasan dan biaya-biaya lainnya (jika ada) dibayarkan melalui virtual account yang tercantum dalam halaman pembayaran/ instruksi pembayaran atau rekening BIDKU sebagai berikut:
                <ul className="list-disc pl-6 mt-1">
                  <li>Bank : BCA</li>
                  <li>Nomor Rekening : 5265312800</li>
                  <li>Atas Nama : PT INDO LELANG SEJAHTERA</li>
                </ul>
              </li>
              <li><strong>5.2.</strong> Dalam hal Pemenang Lelang melakukan pembayaran melalui rekening BIDKU, maka Pemenang Lelang wajib melakukan konfirmasi dengan datang langsung ke cabang BIDKU terkait sesuai dengan lokasi Lelang yang diikuti oleh Pemenang Lelang atau menghubungi contact center resmi BIDKU pada nomor Whatsapp 08170993078, dengan format sebagai berikut:
                <ul className="list-disc pl-6 mt-1">
                  <li>Nama pemenang :</li>
                  <li>Unit yang dimenangkan :</li>
                  <li>No. Polisi :</li>
                  <li>Bank Asal :</li>
                  <li>Bukti Transfer : (dilampirkan)</li>
                </ul>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-md font-bold text-on-surface font-serif mt-6 mb-3">6. Pernyataan dan Jaminan</h2>
            <p className="mb-2">Calon/Peserta Lelang dengan ini menyatakan dan menjamin bahwa:</p>
            <ul className="space-y-2">
              <li><strong>6.1.</strong> Calon/Peserta Lelang merupakan pihak yang telah cakap hukum, berwenang dan sah untuk melakukan tindakan ataupun transaksi dalam proses lelang.</li>
              <li><strong>6.2.</strong> Data dan dokumen yang dilampirkan dalam proses pendaftaran dan/atau yang akan dilampirkan dalam proses pengambilan/serah terima adalah sah, benar dan berlaku sesuai dengan ketentuan yang berlaku di .</li>
              <li><strong>6.3.</strong> Calon/Peserta Lelang memahami bahwa dalam proses lelang ini BIDKU merupakan mediator dalam penjualan Objek Lelang sehingga:
                <ul className="list-[lower-alpha] pl-6 mt-1 space-y-1">
                  <li>Apabila Objek Lelang tidak berada pada tempat BIDKU, maka seluruh tanggung jawab penyerahan Objek Lelang adalah tanggung jawab dari Penjual</li>
                  <li>Keaslian dan kebenaran dokumen kepemilikan sepenuhnya merupakan tanggung jawab Penjual dan BIDKU tidak memiliki kewajiban untuk memverifikasi dokumen tersebut.</li>
                  <li>Dalam hal adanya pengajuan klaim dari Pemenang Lelang terkait Objek Lelang, BIDKU membantu Pemenang Lelang dalam penerusan klaim kepada Penjual.</li>
                  <li>Pemenang Lelang ataupun Peserta Lelang memahami dan menyetujui bahwa BIDKU tidak memiliki kewenangan atau tanggung jawab apapun untuk memberi suatu ganti rugi dan keputusan apapun kepada Pemenang Lelang tanpa persetujuan dari Penjual.</li>
                </ul>
                <p className="mt-2">Dengan ini, Calon/Peserta Lelang melepaskan dan membebaskan BIDKU dari segala tuntutan dan/atau gugatan hukum maupun pemberian ganti rugi atau pertanggungjawaban finansial yang mungkin ada dikemudian hari sehubungan klaim yang diajukan oleh Pemenang Lelang.</p>
              </li>
              <li><strong>6.4.</strong> Calon/Peserta Lelang memahami dan mengerti bahwa:
                <ul className="list-[lower-alpha] pl-6 mt-1 space-y-1">
                  <li>BIDKU tidak melakukan pembongkaran dan uji coba terhadap Objek Lelang, sehingga seluruh informasi atas Objek Lelang yang dituangkan dalam Katalog merupakan informasi yang diperoleh BIDKU tanpa melalui proses tersebut diatas.</li>
                  <li>Informasi atas Objek Lelang yang tertera dalam Katalog, Lembar Data Kendaraan, foto serta dokumen serupa lainnya adalah wadah yang disediakan oleh BIDKU untuk mempermudah Peserta Lelang dan bukan merupakan jaminan atas kondisi asli Objek Lelang. Kondisi asli dari Objek Lelang wajib dilihat langsung oleh Peserta Lelang pada Open House, sehingga ada atau kurangnya informasi pada seluruh media informasi tersebut bukan merupakan suatu bentuk kelalaian dari BIDKU dan tidak dapat dijadikan dasar pengajuan klaim oleh Pemenang Lelang.</li>
                  <li>Objek Lelang dilelang dalam kondisi apa adanya, baik kondisi fisik, mesin maupun legalitas/Dokumen Kepemilikan, sehingga jika terdapat kekurangan/cacat baik yang terlihat maupun yang tidak terlihat, maka semua akan menjadi tanggung jawab/risiko Pemenang Lelang. Oleh karena itu, Pemenang Lelang melepaskan segala hak untuk menuntut dan/atau meminta ganti rugi atas hal tersebut kepada BIDKU.</li>
                  <li>BIDKU berhak merahasiakan data Penjual dari Peserta Lelang dan Pemenang Lelang.</li>
                  <li>BIDKU tidak bertanggung jawab atas adanya kesalahan teknis maupun personal/ pribadi yang dilakukan Peserta Lelang dalam melakukan penawaran saat Lelang.</li>
                  <li>Seluruh pembayaran baik berupa deposit, pelunasan, biaya administrasi lelang atau biaya-biaya lain yang terkait dengan proses Lelang akan dibayarkan melalui BIDKU sebagai Balai Lelang yang akan melakukan proses Lelang.</li>
                  <li>BIDKU tidak bertanggung jawab atas segala konsekuensi pajak, kewajiban pelaporan, atau klaim perpajakan yang timbul di kemudian hari terhadap Peserta Lelang dan/atau Pemenang Lelang yang didasarkan pada Nomor Induk Kependudukan (NIK) dan/atau Nomor Pokok Wajib Pajak (NPWP) yang dicantumkan oleh Peserta Lelang pada saat pendaftaran. Peserta Lelang menjamin keakuratan data pajak yang diberikan dan membebaskan BIDKU dari segala tuntutan hukum apabila terjadi ketidaksesuaian data dalam pelaporan pajak resmi.</li>
                  <li>Pengambilan konten dalam bentuk foto, video, maupun rekaman suara di seluruh area operasional BIDKU (termasuk namun tidak terbatas pada area Open House dan Tempat Pelaksanaan Lelang) untuk kebutuhan publikasi di media sosial atau media massa lainnya, wajib mendapatkan persetujuan tertulis terlebih dahulu dari tim Corporate Communication BIDKU. BIDKU berhak menindak tegas setiap pelanggaran publikasi yang merugikan citra atau operasional BIDKU</li>
                </ul>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-md font-bold text-on-surface font-serif mt-6 mb-3">7. Pelepasan</h2>
            <p>
              Pemenang Lelang menyetujui dan memahami atas perselisihan yang timbul adalah dengan Penjual, Pemenang Lelang melepaskan BIDKU (termasuk Induk Perusahaan, Direktur, dan karyawan) termasuk namun tidak terbatas pada kerugian yang timbul dari pembelian Objek Lelang. Dengan demikian maka Pengguna dengan sengaja melepaskan segala perlindungan hukum (yang terdapat dalam undang-undang atau peraturan hukum yang lain) yang akan membatasi cakupan ketentuan pelepasan ini.
            </p>
          </section>

          <section>
            <h2 className="text-heading-md font-bold text-on-surface font-serif mt-6 mb-3">8. Pilihan Hukum</h2>
            <p>
              Perjanjian ini akan diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia, tanpa memperhatikan pertentangan aturan hukum. Anda setuju bahwa tindakan hukum apapun atau sengketa yang mungkin timbul dari, berhubungan dengan, atau berada dalam cara apapun berhubungan dengan situs dan/atau Perjanjian ini akan diselesaikan secara eksklusif dalam yurisdiksi pengadilan Republik Indonesia.
            </p>
          </section>

          <section>
            <h2 className="text-heading-md font-bold text-on-surface font-serif mt-6 mb-3">9. Lain-Lain</h2>
            <ul className="space-y-2">
              <li><strong>9.1.</strong> Seluruh komunikasi terkait informasi lelang dan/atau Objek Lelang hanya dapat dilakukan melalui call center resmi BIDKU pada nomor 1500369 atau melalui contact center resmi BIDKU pada nomor Whatsapp 08170993078.</li>
              <li><strong>9.2.</strong> BIDKU tidak bertanggung jawab atas segala informasi, pernyataan, dan/atau kerugian yang timbul akibat komunikasi yang dilakukan melalui media lain di luar call center resmi BIDKU.</li>
              <li><strong>9.3.</strong> Seluruh proses pelaksanaan lelang tunduk pada ketentuan hukum yang berlaku di Negara Republik Indonesia termasuk namun tidak terbatas pada Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.</li>
              <li><strong>9.4.</strong> Dalam hal selama proses Lelang, Pemenang Lelang telah menyelesaikan seluruh kewajiban pembayarannya namun belum mengambil Objek Lelang dan kemudian Pemenang Lelang dinyatakan meninggal dunia, proses Pengambilan Objek Lelang akan diselesaikan dengan ahli waris yang sah dari Pemenang Lelang. Pihak yang menyatakan diri sebagai ahli waris dari Pemenang Lelang wajib menyertakan dokumen pendukung yang dapat dipertanggung jawabkan sesuai ketentuan hukum yang berlaku di Negara Republik Indonesia.</li>
              <li><strong>9.5.</strong> BIDKU dapat menyelenggarakan kegiatan lelang dalam rangka program, event, ataupun lelang atas objek tertentu dengan memberlakukan syarat dan ketentuan tambahan atau khusus (&quot;S&K Khusus&quot;) yang dipublikasikan pada situs web www.bidku.co.id atau Aplikasi BIDKU. Syarat dan Ketentuan Lelang ini tetap berlaku dan mengikat dalam pelaksanaan lelang khusus tersebut, kecuali diatur lain secara berbeda dalam S&K Khusus yang bersangkutan.</li>
              <li><strong>9.6.</strong> BIDKU berhak mengubah dan/atau memperbaharui Syarat dan Ketentuan ini setiap saat tanpa pemberitahuan kepada Pengguna melalui situs web atau aplikasi BIDKU. Pengguna dianggap senantiasa memeriksa, membaca secara seksama dari waktu ke waktu untuk mengetahui perubahan apapun pada Syarat dan Ketentuan ini. Dengan tetap mengakses, mendaftarkan diri dan mengikuti lelang yang diinformasikan atau diadakan melalui situs web atau aplikasi BIDKU, maka Pengguna dianggap telah menyetujui segala perubahan-perubahan dalam Syarat dan Ketentuan ini.</li>
            </ul>
            <p className="mt-4 font-medium">
              Dengan ini Pengguna menyatakan telah membaca, mengerti, memahami dan menyetujui serta bersedia untuk tunduk dan mengikatkan diri pada seluruh isi dari Syarat dan Ketentuan ini dan pernyataan ini diberikan dalam keadaan sadar, sehat jasmani dan rohani serta tanpa paksaan dari pihak manapun sehingga berlaku sah dan mengikat BIDKU dan Pengguna.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
