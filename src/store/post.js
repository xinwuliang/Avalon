import Api from '~/api/postApi'

const state = () => ({
  trending: {
    take: 10,
    new: {
      data: [],
      noMore: false
    },
    hot: {
      data: [],
      noMore: false
    }
  },
  show: {
    init: true,
    take: 10,
    info: {
      bangumi: null,
      user: null,
      post: null
    },
    data: {
      total: 0,
      list: [],
      noMore: false
    }
  }
})

const mutations = {
  setPost (state, data) {
    state.show.data = {
      list: state.show.data.list.concat(data.list),
      noMore: state.show.init ? (data.list.length < state.show.take - 1) : (data.list.length < state.show.take),
      total: data.total
    }
    if (state.show.init) {
      state.show.info = {
        bangumi: data.bangumi,
        user: data.user,
        post: data.post
      }
      state.show.init = false
    }
  },
  setComment (state, { postId, data }) {
    state.show.data.list.forEach((item, index) => {
      if (item.id === postId) {
        state.show.data.list[index].comments.push(data)
        state.show.data.list[index].comment_count++
      }
    })
  },
  setComments (state, { postId, data }) {
    state.show.data.list.forEach((post, index) => {
      if (post.id === postId) {
        state.show.data.list[index].comments = state.show.data.list[index].comments.concat(data)
      }
    })
  },
  delPost (state, postId) {
    if (postId === state.show.info.post.id) {
      return
    }
    state.show.data.list.forEach((item, index) => {
      if (item.id === postId) {
        state.show.data.list.splice(index, 1)
        state.show.data.total--
      }
    })
  },
  delComment (state, { postId, commentId }) {
    state.show.data.list.forEach((post, index) => {
      if (post.id === postId) {
        state.show.data.list[index].comments.forEach((comment, subIndex) => {
          if (comment.id === commentId) {
            state.show.data.list[index].comments.splice(subIndex, 1)
            state.show.data.list[index].comment_count--
          }
        })
      }
    })
  },
  setTrending (state, { data, sort }) {
    state.trending[sort] = {
      data: state.trending[sort].data.concat(data),
      noMore: data.length < state.trending.take
    }
  },
  TOGGLE_LIKE (state, { id, result }) {
    if (id === state.show.info.post.id) {
      state.show.info.post.liked = result
      result ? state.show.info.post.like_count++ : state.show.info.post.like_count--
    } else {
      state.show.data.list.forEach((item, index) => {
        if (item.id === id) {
          state.show.data.list[index].liked = result
          result ? state.show.data.list[index].like_count++ : state.show.data.list[index].like_count--
        }
      })
    }
  },
  TOGGLE_MARK (state, result) {
    state.show.info.post.marked = result
    result ? state.show.info.post.mark_count++ : state.show.info.post.mark_count--
  },
  REPLY_POST (state, data) {
    state.show.data.list.push(data)
    state.show.info.post.comment_count++
    state.show.data.total++
    const images = data.images
    if (images.length) {
      state.show.info.post.previewImages = state.show.info.post.previewImages.concat(images)
    }
  },
  followBangumi (state, result) {
    state.show.info.bangumi.followed = result
  }
}

const actions = {
  async getPost ({ state, commit }, { id, ctx, only, reply }) {
    const api = new Api(ctx)
    const length = state.show.data.list.length
    const data = await api.show({
      id,
      only,
      seenIds: length ? state.show.data.list.map(item => item.id).join(',') : null,
      take: state.show.take,
      replyId: length ? null : reply
    })
    commit('setPost', data)
  },
  async getComments ({ state, commit }, { postId }) {
    state.show.data.list.forEach(async (post, index) => {
      if (post.id === postId) {
        const api = new Api()
        const seenIds = state.show.data.list[index].comments.length
          ? state.show.data.list[index].comments.map(item => item.id).join(',')
          : null
        const data = await api.comments({ postId, seenIds })
        commit('setComments', { postId, data })
      }
    })
  },
  async setComment ({ commit }, { postId, targetUserId, content, ctx }) {
    const api = new Api(ctx)
    const data = await api.comment({ postId, targetUserId, content })
    commit('setComment', { data, postId })
  },
  // eslint-disable-next-line no-empty-pattern
  async create ({}, params) {
    const api = new Api(params.ctx)
    const id = await api.create(params)
    return id
  },
  async reply ({ commit }, params) {
    const api = new Api(params.ctx)
    const data = await api.reply(params)
    commit('REPLY_POST', data)
  },
  async deletePost ({ commit }, { ctx, id }) {
    const api = new Api(ctx)
    await api.deletePost(id)
    commit('delPost', id)
  },
  async deleteComment ({ commit }, { ctx, postId, commentId }) {
    const api = new Api(ctx)
    await api.deleteComment({
      postId, commentId
    })
    commit('delComment', { postId, commentId })
  },
  async getTrending ({ state, commit }, { sort, ctx }) {
    if (state.trending[sort].noMore) {
      return
    }
    const api = new Api(ctx)
    const data = await api.trending({
      sort,
      take: state.trending.take,
      seenIds: state.trending[sort].data.length ? state.trending[sort].data.map(item => item.id).join(',') : null
    })
    commit('setTrending', { sort, data })
  },
  async toggleLike ({ commit }, { ctx, id }) {
    const api = new Api(ctx)
    const result = await api.toggleLike(id)
    commit('TOGGLE_LIKE', { id, result })
  },
  async toggleMark ({ commit }, { ctx, id }) {
    const api = new Api(ctx)
    const result = await api.toggleMark(id)
    commit('TOGGLE_MARK', result)
  }
}

const getters = {}

export default {
  namespaced: true,
  state,
  actions,
  mutations,
  getters
}
