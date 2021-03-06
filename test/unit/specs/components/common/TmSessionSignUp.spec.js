import { createLocalVue, shallowMount } from "@vue/test-utils"
import Vuelidate from "vuelidate"
import TmSessionSignUp from "common/TmSessionSignUp"

describe(`SessionSignUp`, () => {
  const localVue = createLocalVue()
  localVue.use(Vuelidate)

  let wrapper, $store

  beforeEach(() => {
    $store = {
      commit: jest.fn(),
      dispatch: jest.fn(() => Promise.resolve(`seed`))
    }
    wrapper = shallowMount(TmSessionSignUp, {
      localVue,
      getters: {
        connected: () => true
      },
      mocks: {
        $store
      }
    })
  })

  it(`has the expected html structure`, () => {
    expect(wrapper.vm.$el).toMatchSnapshot()
  })

  it(`should go back to the welcome screen on click`, () => {
    wrapper
      .findAll(`.tm-session-header a`)
      .at(0)
      .trigger(`click`)
    expect($store.commit).toHaveBeenCalledWith(`setSessionModalView`, `welcome`)
  })

  it(`should close the modal on successful login`, async () => {
    const commit = jest.fn()
    await TmSessionSignUp.methods.onSubmit.call({
      $store: {
        commit,
        dispatch: jest.fn()
      },
      $v: {
        $touch: () => {},
        $error: false
      },
      fields: {
        signUpPassword: `1234567890`,
        signUpPasswordConfirm: `1234567890`,
        signUpSeed: `bar`, // <-- doesn#t check for correctness of seed
        signUpName: `testaccount`,
        signUpWarning: true
      }
    })
    expect(commit).toHaveBeenCalledWith(`toggleSessionModal`, false)
  })

  it(`should signal signedin state on successful login`, async () => {
    const commit = jest.fn()
    const dispatch = jest.fn()
    await TmSessionSignUp.methods.onSubmit.call({
      $store: {
        commit,
        dispatch
      },
      $v: {
        $touch: () => {},
        $error: false
      },
      fields: {
        signUpPassword: `1234567890`,
        signUpPasswordConfirm: `1234567890`,
        signUpSeed: `bar`, // <-- doesn#t check for correctness of seed
        signUpName: `testaccount`,
        signUpWarning: true
      }
    })
    expect(commit).toHaveBeenCalledWith(`notify`, expect.any(Object))
    expect(dispatch).toHaveBeenCalledWith(`signIn`, {
      password: `1234567890`,
      localKeyPairName: `testaccount`
    })
  })

  it(`should set error collection opt in state`, async () => {
    const commit = jest.fn()
    const dispatch = jest.fn()
    await TmSessionSignUp.methods.onSubmit.call({
      $store: {
        commit,
        dispatch
      },
      $v: {
        $touch: () => {},
        $error: false
      },
      fields: {
        signUpPassword: `1234567890`,
        signUpPasswordConfirm: `1234567890`,
        signUpSeed: `bar`, // <-- doesn#t check for correctness of seed
        signUpName: `testaccount`,
        signUpWarning: true,
        errorCollection: true
      }
    })
    expect(dispatch).toHaveBeenCalledWith(`setErrorCollection`, {
      account: `testaccount`,
      optin: true
    })

    dispatch.mockClear()

    await TmSessionSignUp.methods.onSubmit.call({
      $store: {
        commit,
        dispatch
      },
      $v: {
        $touch: () => {},
        $error: false
      },
      fields: {
        signUpPassword: `1234567890`,
        signUpPasswordConfirm: `1234567890`,
        signUpSeed: `bar`, // <-- doesn#t check for correctness of seed
        signUpName: `testaccount`,
        signUpWarning: false,
        errorCollection: false
      }
    })
    expect(dispatch).toHaveBeenCalledWith(`setErrorCollection`, {
      account: `testaccount`,
      optin: false
    })
  })

  it(`should show error if warnings not acknowledged`, () => {
    wrapper.setData({
      fields: {
        signUpPassword: `1234567890`,
        signUpPasswordConfirm: `1234567890`,
        signUpSeed: `bar`,
        signUpName: `testaccount`,
        signUpWarning: false
      }
    })
    wrapper.vm.onSubmit()
    expect($store.commit).not.toHaveBeenCalled()
    expect(wrapper.find(`.tm-form-msg-error`)).toBeDefined()
  })

  it(`should show error if password is not 10 long`, async () => {
    wrapper.setData({
      fields: {
        signUpPassword: `123456789`,
        signUpPasswordConfirm: `1234567890`,
        signUpSeed: `bar`,
        signUpName: `testaccount`,
        signUpWarning: true
      }
    })
    await wrapper.vm.onSubmit()
    expect($store.commit.mock.calls[0]).toBeUndefined()
    expect(wrapper.find(`.tm-form-msg-error`)).toBeDefined()
  })

  it(`should show error if password is not confirmed`, async () => {
    wrapper.setData({
      fields: {
        signUpPassword: `1234567890`,
        signUpPasswordConfirm: `notthesame`,
        signUpSeed: `bar`,
        signUpName: `testaccount`,
        signUpWarning: true
      }
    })
    await wrapper.vm.onSubmit()
    expect($store.commit.mock.calls[0]).toBeUndefined()
    expect(wrapper.find(`.tm-form-msg-error`)).toBeDefined()
  })

  it(`should show an error if account name is not 5 long`, async () => {
    wrapper.setData({
      fields: {
        signUpPassword: `1234567890`,
        signUpPasswordConfirm: `1234567890`,
        signUpSeed: `bar`,
        signUpName: `test`,
        signUpWarning: true
      }
    })
    await wrapper.vm.onSubmit()
    expect($store.commit.mock.calls[0]).toBeUndefined()
    expect(wrapper.find(`.tm-form-msg-error`)).toBeDefined()
  })

  it(`should not continue if creation failed`, async () => {
    $store.dispatch = jest.fn(() =>
      Promise.reject(new Error(`Account already exists`))
    )
    wrapper.setData({
      fields: {
        signUpPassword: `1234567890`,
        signUpPasswordConfirm: `1234567890`,
        signUpSeed: `bar`,
        signUpName: `testaccount`,
        signUpWarning: true
      }
    })
    await wrapper.vm.onSubmit()
    expect($store.commit).toHaveBeenCalledWith(
      `notifyError`,
      expect.objectContaining({ body: `Account already exists` })
    )
  })

  it(`should show a notification if creation failed`, async () => {
    const $store = {
      commit: jest.fn(),
      dispatch: jest.fn(() => Promise.reject({ message: `reason` }))
    }

    const self = {
      fields: {
        signUpPassword: `1234567890`,
        signUpPasswordConfirm: `1234567890`,
        signUpSeed: `bar`,
        signUpName: `testaccount`,
        signUpWarning: true
      },
      $v: {
        $touch: () => {},
        $error: false
      },
      $store
    }
    await TmSessionSignUp.methods.onSubmit.call(self)
    expect($store.commit).toHaveBeenCalledWith(`notifyError`, {
      title: `Couldn't create account`,
      body: expect.stringContaining(`reason`)
    })
  })
})
