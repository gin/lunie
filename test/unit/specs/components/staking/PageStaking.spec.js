import setup from "../../../helpers/vuex-setup"
import PageStaking from "renderer/components/staking/PageStaking"
import lcdClientMock from "renderer/connectors/lcdClientMock.js"

// TODO refactor according to new unit test standard
describe(`PageStaking`, () => {
  let wrapper, store
  const { mount } = setup()

  beforeEach(() => {
    const instance = mount(PageStaking, {
      stubs: {
        "tm-balance": true
      }
    })
    wrapper = instance.wrapper
    store = instance.store

    store.commit(`setConnected`, true)
    store.commit(`setSignIn`, true)
    store.state.user.address = lcdClientMock.addresses[0]
    store.dispatch(`updateDelegates`)
  })

  describe(`has the expected html structure`, () => {
    it(`if user has signed in`, async () => {
      // somehow we need to wait one tick for the total atoms to update
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.$el).toMatchSnapshot()
    })

    it(`if user hasn't signed in`, async () => {
      const instance = mount(PageStaking, {
        doBefore: ({ store }) => {
          store.commit(`setSignIn`, false)
        },
        stubs: {
          "tm-balance": true
        }
      })
      wrapper = instance.wrapper
      store = instance.store
      expect(wrapper.vm.$el).toMatchSnapshot()
      expect(wrapper.vm.tabs).not.toContain({
        displayName: `My Delegations`,
        pathName: `My Delegations`
      })
    })
  })

  it(`should refresh candidates on click`, () => {
    wrapper
      .findAll(`.tool-bar i`)
      .at(1)
      .trigger(`click`)
    expect(store.dispatch).toHaveBeenCalledWith(`updateDelegates`)
  })
})
