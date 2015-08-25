<% facebook = {:u=>"http://#{request.host}/us"}
                      twitter = {:url=>"http://hourofcode.com", :related=>"codeorg", :hashtags=>"", :text=>hoc_s(:twitter_default_text)}
                      twitter[:hashtags] = "HourOfCode" unless hoc_s(:twitter_default_text).include? "#HourOfCode" %>



# 謝謝您報名舉辦Hour of Code!

**每一位**一小時程式設計活動的組織者，將會收到 10 GB 的 Dropbox 空間或 Skype 10 美元的額度作為感謝。[ 細節](<%= hoc_uri('/prizes') %>)

## 1.廣為宣傳

告訴你的朋友關於 #HourOfCode 。

<%= view :share_buttons, facebook:facebook, twitter:twitter %>

<% if @country == 'us' %>

## 2.要求你的整所學校都提供一小程式設計活動

[Send this email](<%= hoc_uri('/resources#email') %>) or [this handout](/files/hoc-one-pager.pdf) to your principal.

<% else %>

## 2.要求你的整所學校都提供一小程式設計活動

[Send this email](<%= hoc_uri('/resources#email') %>) or give [this handout](/files/hoc-one-pager.pdf) this handout</a> to your principal.

<% end %>

## 3.慷慨的捐贈

[Donate to our crowdfunding campaign.](http://<%= codeorg_url() %>/donate) To teach 100 million children, we need your support. We just launched the [largest education crowdfunding campaign](http://<%= codeorg_url() %>/donate) in history. *Every* dollar will be matched [donors](http://<%= codeorg_url() %>/about/donors), doubling your impact.

## 3. 問問你的同事是否想參與

[Send this email](<%= hoc_uri('/resources#email') %>) to your manager, or the CEO. Or [give them this handout](http://hourofcode.com/files/hoc-one-pager.pdf).

## 4. 在社區內宣傳一下Hour of Code

Recruit a local group — boy/girl scouts club, church, university, veterans group or labor union. Or host an Hour of Code "block party" for your neighborhood.

## 5. 找當地的民選官員支持Hour of Code

[Send this email](<%= hoc_uri('/resources#politicians') %>) to your mayor, city council, or school board. Or [give them this handout](http://hourofcode.com/files/hoc-one-pager.pdf) and invite them to visit your school.

<%= view 'popup_window.js' %>