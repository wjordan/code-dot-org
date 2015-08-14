<% facebook = {:u=>"http://#{request.host}/us"}
                      twitter = {:url=>"http://hourofcode.com", :related=>"codeorg", :hashtags=>"", :text=>hoc_s(:twitter_default_text)}
                      twitter[:hashtags] = "HourOfCode" unless hoc_s(:twitter_default_text).include? "#HourOfCode" %>



# Hour of Codeのイベント主催への登録にご協力頂き大変ありがとうございます！

**全ての** Hour of Code の主催者は、Dropboxの10 GB容量 か $10 のSkype creditを感謝のしるしとして受領頂けます。 [詳細](<%= hoc_uri('/prizes') %>)

## 1. みんなに広めましょう

友達に #HourOfCodeを教えましょう。

<%= view :share_buttons, facebook:facebook, twitter:twitter %>

<% if @country == 'us' %>

## 2. Hour of Codeを主催するよう学校と交渉しましょう。

[Send this email](<%= hoc_uri('/resources#email') %>) or [this handout](/files/hoc-one-pager.pdf) to your principal.

<% else %>

## 2. Hour of Codeを主催するよう学校と交渉しましょう。

[Send this email](<%= hoc_uri('/resources#email') %>) or give [this handout](/files/hoc-one-pager.pdf) this handout</a> to your principal.

<% end %>

## 3. 寄付のお願い

[Donate to our crowdfunding campaign.](http://<%= codeorg_url() %>/donate) To teach 100 million children, we need your support. We just launched the [largest education crowdfunding campaign](http://<%= codeorg_url() %>/donate) in history. *Every* dollar will be matched [donors](http://<%= codeorg_url() %>/about/donors), doubling your impact.

## 4. 雇用主にも参加するよう聞いてみてください。

[Send this email](<%= hoc_uri('/resources#email') %>) to your manager, or the CEO. Or [give them this handout](http://hourofcode.com/files/hoc-one-pager.pdf).

## 4. あなたのコミュニティーにもHour of Codeを宣伝しましょう。

Recruit a local group — boy/girl scouts club, church, university, veterans group or labor union. Or host an Hour of Code "block party" for your neighborhood.

## 6. Hour of Codeを支援してもらえるよう地元の議員に聞いてみましょう。

[Send this email](<%= hoc_uri('/resources#politicians') %>) to your mayor, city council, or school board. Or [give them this handout](http://hourofcode.com/files/hoc-one-pager.pdf) and invite them to visit your school.

<%= view 'popup_window.js' %>