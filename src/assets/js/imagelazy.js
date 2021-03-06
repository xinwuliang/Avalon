export default {
  name: 'v-img',
  props: {
    tag: {
      type: String,
      default: 'img'
    },
    src: {
      required: true,
      type: String,
      default: ''
    },
    width: {
      type: [Number, String],
      default: 0
    },
    height: {
      type: [Number, String],
      default: 0
    },
    scale: {
      type: [Number, String],
      default: 2
    },
    mode: {
      type: [Number, String],
      default: 1
    },
    events: {
      type: Array,
      default: function () {
        return ['scroll', 'resize']
      }
    },
    id: {},
    aspect: {
      type: Number,
      default: 0
    }
  },
  render: function (createElement) {
    return createElement(this.tag, {
      'class': {
        'image-lazy-mask': this.aspect
      },
      style: this.aspect ? {
        paddingBottom: `${this.aspect * 100}%`
      } : {}
    })
  },
  data () {
    return {
      listeners: {},
      resource: this.src
    }
  },
  mounted () {
    this.init()
  },
  methods: {
    init () {
      this.$nextTick(() => {
        const image = this.$el
        if (this.$checkInView(image, (this.scale - 0))) {
          this.loadResource(image)
        } else {
          const id = this.$eventManager.add(document, this.events, this.$utils.throttle(() => {
            if (this.$checkInView(image, (this.scale - 0))) {
              this.loadResource(image)
              this.$eventManager.del(id)
            }
          }, 500))
          if (this.id) {
            this.$channel.$on(`image-load-${this.id}`, () => {
              this.loadResource(image)
              this.$eventManager.del(id)
              this.$channel.$off(`image-load-${this.id}`)
            })
          }
        }
      })
    },
    loadResource (image) {
      let src
      if (this.width && this.height) {
        src = this.$resize(this.resource, {
          width: (this.width - 0) * 2,
          height: (this.height - 0) * 2,
          mode: (this.mode - 0)
        })
      } else if (this.width) {
        src = this.$resize(this.resource, {
          width: (this.width - 0) * 2,
          mode: (this.mode - 0)
        })
      } else if (this.height) {
        src = this.$resize(this.resource, {
          height: (this.height - 0) * 2,
          mode: (this.mode - 0)
        })
      } else {
        src = this.resource
      }
      src = src.split('|http').length > 1 ? `http${src.split('|http').pop()}` : src
      if (this.tag.toLowerCase() === 'img') {
        image.setAttribute('src', src)
        if (this.aspect) {
          const id = this.$eventManager.add(this.$el, 'load', () => {
            this.$utils.setStyle(this.$el, 'padding-bottom', 0)
            this.$el.classList.remove('image-lazy-mask')
            this.$eventManager.del(id)
          })
        }
      } else {
        image.style.backgroundImage = `url(${src})`
      }
    }
  }
}
