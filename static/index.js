var ItemsVue = new Vue({
  el: '#Itemlist',
  data: {
    items: []
  },
  mounted: function () {
    var self = this
    $.ajax({
      url: 'list', method: 'GET', success: function (data) { self.items = data }
    })
  },
  methods: {
    remove: function (e) {
      if (confirm('Точно удалить ссылку?')) {
        const id = e.target.id
        var self = this
        $.ajax({
            url: 'remove/' + id, method: 'GET', success: function (data) { self.items = data }
        })
      }
    },
    add: function (e) {
      const filename = $('#filename').val()
      $('#filename').val('')
      const comment = $('#comment').val() || '-'
      $('#comment').val('')
      const days = $('#days').val() || '3'
      $('#days').val('')
      var self = this
      $.ajax({
        url: 'add/' + filename + '/' + comment+ '/' +days, method: 'GET', success: function (data) { self.items = data }
      })
    }
  }
})

var FilesVue = new Vue({
  el: '#FileList',
  data: {
    items: []
  },
  mounted: function () {
    var self = this
    $.ajax({
      url: 'filesList', method: 'GET', success: function (data) { self.items = data }
    })
  },
  methods: {
    remove: function (e) {
      var self = this
      if (confirm('Точно удалить файл?')) {
        const id = e.target.id
        $.ajax({
          url: 'removeFile/' + id, method: 'GET', success: function (data) { self.items = data }
        })
      }
    }
  }
})

$('.custom-file-input').on('change', function () {
  var fileName = $(this).val().split('\\').pop()
  $(this).siblings('.custom-file-label').addClass('selected').html(fileName)
  $('#upload-button').removeAttr("disabled") = false
})
