<% facebook = {:u=>"http://#{request.host}/us"}
                      twitter = {:url=>"http://hourofcode.com", :related=>"codeorg", :hashtags=>"", :text=>hoc_s(:twitter_default_text)}
                      twitter[:hashtags] = "HourOfCode" unless hoc_s(:twitter_default_text).include? "#HourOfCode" %>



# Terima kasih karena telah mendaftar sebagai penyelengara Hour of Code!

**SETIAP** penyelenggara Hour of Code akan menerima 10 GB ruang Dropbox atau $10 kredit dari Skype sebagai terima kasih. </p> 

## 1. Sebarkan berita

Beritahu temanmu mengenai #HourOfCode.

<%= view :share_buttons, facebook:facebook, twitter:twitter %>

<% if @country == 'us' %>

## 2. Tawarkan pada seluruh isi sekolah anda untuk mengikuti Hour of Code

[Send this email](<%= hoc_uri('/resources#email') %>) or [this handout](/files/hoc-one-pager.pdf) to your principal.

<% else %>

## 2. Tawarkan pada seluruh isi sekolah anda untuk mengikuti Hour of Code

[Send this email](<%= hoc_uri('/resources#email') %>) or give [this handout](/files/hoc-one-pager.pdf) this handout</a> to your principal.

<% end %>

## 3. Menyumbangkan dengan murah hati

[Donate to our crowdfunding campaign.](http://<%= codeorg_url() %>/donate) To teach 100 million children, we need your support. We just launched the [largest education crowdfunding campaign](http://<%= codeorg_url() %>/donate) in history. *Every* dollar will be matched [donors](http://<%= codeorg_url() %>/about/donors), doubling your impact.

## Tanyakan pada bos anda untuk ikut terlibat

[Send this email](<%= hoc_uri('/resources#email') %>) to your manager, or the CEO. Or [give them this handout](http://hourofcode.com/files/hoc-one-pager.pdf).

## 5. Promosikan Hour of Code dalam komunitas Anda

Recruit a local group — boy/girl scouts club, church, university, veterans group or labor union. Or host an Hour of Code "block party" for your neighborhood.

## 5. Tanyakan seorang pejabat terpilih setempat untuk mendukung Hour of Code

[Send this email](<%= hoc_uri('/resources#politicians') %>) to your mayor, city council, or school board. Or [give them this handout](http://hourofcode.com/files/hoc-one-pager.pdf) and invite them to visit your school.

<%= view 'popup_window.js' %>