<style lang="scss">
  #video-show {
    $meta-height: 30px;
    $meta-margin-bottom: 8px;

    #metas {
      margin-bottom: 20px;
      padding-right: 55px;
      overflow: hidden;
      position: relative;
      min-height: 30px;

      ul {
        margin-bottom: 5px;
      }

      li {
        float: left;
        margin: 0 8px $meta-margin-bottom 0;
      }

      .season-title {
        padding-bottom: 10px;
        margin-left: 10px;
      }

      .meta, .more {
        border: 1px solid $color-gray-deep;
        height: $meta-height;
        color: $color-link;
        border-radius: 4px;
        display: block;
        transition: .2s;
        padding: 0 15px 0 8px;
        font-size: 14px;
        line-height: 28px;

        span {
          min-width: 16px;
          margin-right: 5px;
          display: inline-block;
          text-align: right;
        }

        &:hover {
          border-color: $color-blue-light;
          background-color: $color-blue-light;
          color: $color-white;
        }
      }

      .router-link-active {
        border-color: $color-blue-light;
        background-color: $color-blue-light;
        color: $color-white;
      }

      .more {
        cursor: pointer;
        position: absolute;
        right: 0;
        top: 0;
        width: 50px;
        padding-right: 8px;
        text-align: center;
      }
    }

    .video-placeholder {
      min-height: 600px;
      background-color: #000;
    }

    .video-info {
      margin-top: 30px;
    }

    .bangumi-panel {
      float: left;
    }

    .v-share {
      height: 40px;
      float: right;
    }

    .video-report {
      float: right;
      margin-right: 15px;
      margin-top: 2px;
    }
  }
</style>

<template>
  <div id="video-show" class="main">
    <v-banner></v-banner>
    <div class="container">
      <nav>
        <h1 class="breadcrumb" v-if="bangumi && video">
          <a :href="$alias.index" target="_blank">主站</a>
          <a :href="$alias.bangumi(bangumi.id)" target="_blank" v-text="bangumi.name"></a>
          第{{ video.part }}话&nbsp;{{ video.name }}
        </h1>
      </nav>
      <div id="metas">
        <template v-if="season && showAll">
          <template v-for="(metas, idx) in list">
            <h6 class="season-title" v-text="season.name[idx]"></h6>
            <ul>
              <li v-for="(meta, index) in metas.data" :key="meta.id">
                <a class="meta"
                   :class="{ 'router-link-active' : $route.params.id == meta.id }"
                   :style="{ width: `${maxWidth}px` }"
                   :href="$alias.video(meta.id)">
                  <span>{{ videoPackage.list.repeat ? index + 1 : meta.part }}</span>{{ meta.name }}
                </a>
              </li>
            </ul>
          </template>
        </template>
        <ul v-else>
          <li v-for="meta in sortVideos" :key="meta.id">
            <a class="meta"
               :class="{ 'router-link-active' : $route.params.id == meta.id }"
               :style="{ width: `${maxWidth}px` }"
               :href="$alias.video(meta.id)">
              <span>{{ meta.part }}</span>{{ meta.name }}
            </a>
          </li>
        </ul>
        <div class="more" v-if="showMoreBtn" @click="showAll = !showAll">{{ showAll ? '收起' : '展开' }}</div>
      </div>
      <no-ssr class="video-placeholder">
        <v-video
          :source="computeVideoSrc"
          :other-src="useOtherSiteSource"
          :video="`${bangumi.name} 第 ${video.part} 话 ${video.name}`"
          :poster="$resize(video.poster)"
          :next="nextPartVideo"
          @playing="handlePlaying"
        ></v-video>
      </no-ssr>
      <div class="clearfix video-info">
        <v-bangumi-panel
          class="bangumi-panel"
          :id="bangumi.id"
          :name="bangumi.name"
          :avatar="bangumi.avatar"
          :summary="bangumi.summary"
          :followed="bangumi.followed"
        ></v-bangumi-panel>
        <v-share type="panel"></v-share>
        <el-button
          type="warning"
          size="medium"
          class="video-report"
          round
          @click="handleVideoReportClick"
        >资源报错</el-button>
      </div>
    </div>
  </div>
</template>

<script>
  import vVideo from '~/components/Video'
  import VideoApi from '~/api/videoApi'

  export default {
    name: 'video-show',
    head () {
      return {
        title: `${this.bangumi.name} : 第${this.video.part}话 ${this.video.name} - 视频`,
        meta: [
          { hid: 'description', name: 'description', content: this.bangumi.summary },
          { hid: 'keywords', name: 'keywords', content: `${this.bangumi.name}，第${this.video.part}话，${this.video.name}，在线观看 动画片大全 动漫在线播放 日本动漫 好看的动漫 二次元网站` }
        ]
      }
    },
    components: {
      vVideo
    },
    async asyncData ({ route, store, ctx }) {
      await store.dispatch('video/getShow', {
        id: route.params.id,
        ctx
      })
    },
    computed: {
      id () {
        return parseInt(this.$route.params.id, 10)
      },
      videoPackage () {
        return this.$store.state.video
      },
      video () {
        return this.videoPackage.info
      },
      list () {
        return this.videoPackage.list.videos
      },
      videos () {
        if (!this.season) {
          return this.list
        }
        let result = []
        this.list.forEach(videos => {
          result = result.concat(videos.data)
        })
        return result
      },
      bangumi () {
        return this.videoPackage.bangumi
      },
      sortVideos () {
        const begin = (this.page - 1) * this.take
        return this.showAll ? this.videos : this.videos.slice(begin, begin + this.take)
      },
      season () {
        return this.$store.state.video.season
      },
      showMoreBtn () {
        return this.take < this.videos.length
      },
      nextPartVideo () {
        let lastId = 0
        if (this.season) {
          let videos = []
          this.list.forEach(season => {
            videos = videos.concat(season.data)
          })
          lastId = videos[videos.length - 1].id
        } else {
          lastId = this.list[this.list.length - 1].id
        }
        if (lastId === this.id) {
          return ''
        }
        let nextId = 0
        if (this.season) {
          this.list.forEach(season => {
            season.data.forEach(part => {
              if (part.id === this.id + 1) {
                nextId = part.id
              }
            })
          })
        } else {
          this.list.forEach(part => {
            if (part.id === this.id + 1) {
              nextId = part.id
            }
          })
        }
        if (!nextId) {
          return ''
        }
        return `/video/${nextId}`
      },
      useOtherSiteSource () {
        if (this.bangumi.others_site_video) {
          return true
        }
        const resource = this.video.resource
        if (!resource) {
          return true
        }
        return !((
            resource.video[720] && resource.video[720].src
          ) || (
            resource.video[1080] && resource.video[1080].src
        ))
      },
      computeVideoSrc () {
        const video = this.video
        return this.useOtherSiteSource
          ? video.url
          : video.resource
            ? (
              video.resource.video[720] && video.resource.video[720].src
            ) || (
              video.resource.video[1080] && video.resource.video[1080].src
            ) || video.url
            : video.url
      }
    },
    data () {
      return {
        maxWidth: 0,
        take: 0,
        part: 0,
        page: 0,
        showAll: false,
        firstPlay: true
      }
    },
    methods: {
      computeMaxWidth () {
        let maxlength = 0
        this.videos.forEach(video => {
          const templength = video.name.replace(/([\u4e00-\u9fa5])/g, 'aa').trim().length
          if (maxlength < templength) {
            maxlength = templength
          }
        })
        this.maxWidth = 46 + maxlength * 8
      },
      computePage () {
        this.take = Math.floor(document.getElementById('metas').offsetWidth / (this.maxWidth + 8)) * 2
        this.videos.forEach((meta) => {
          if (meta.id === this.id) {
            this.part = meta.part
          }
        })
        this.page = Math.ceil(this.part / this.take)
      },
      handlePlaying () {
        if (this.firstPlay) {
          this.firstPlay = false
          const api = new VideoApi(this)
          api.playing(this.id)
        }
      },
      handleVideoReportClick () {
        this.$channel.$emit('open-feedback', {
          type: 4,
          desc: `【PC】-《${this.bangumi.name}》第${this.part}话 视频有错误，错误详情为：`
        })
      }
    },
    mounted () {
      this.computeMaxWidth()
      this.computePage()
      window.addEventListener('resize', () => {
        this.computeMaxWidth()
        this.computePage()
      })
      this.$channel.$on('get-page-bangumi-for-post-create', () => {
        this.$channel.$emit('set-page-bangumi-for-post-create', {
          id: this.bangumi.id,
          name: this.bangumi.name,
          avatar: this.bangumi.avatar
        })
      })
    }
  }
</script>
