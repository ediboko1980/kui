/*
 * Copyright 2020 IBM Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as assert from 'assert'
import { Common, CLI, ReplExpect, SidecarExpect, Selectors, Util, Keys } from '@kui-shell/test'
import { waitForGreen, createNS, allocateNS, deleteNS } from '@kui-shell/plugin-kubectl/tests/lib/k8s/utils'

import { mode as lastAppliedMode } from '../../lib/view/modes/last-applied'

const commands = ['kubectl']
if (process.env.NEEDS_OC) {
  commands.push('oc')
}

const podName = 'nginx'
const sourceFile = 'https://raw.githubusercontent.com/kubernetes/examples/master/staging/pod'

commands.forEach(command => {
  describe(`${command} apply subcommands ${process.env.MOCHA_RUN_TARGET || ''}`, function(this: Common.ISuite) {
    before(Common.before(this))
    after(Common.after(this))

    const ns: string = createNS()
    const inNamespace = `-n ${ns}`

    allocateNS(this, ns, command)

    const doCreate = (verb: 'create' | 'apply') => {
      it(`should ${verb === 'create' ? 'create' : 'update'} sample pod from URL via ${command} ${verb}`, async () => {
        try {
          const selector = await CLI.command(`${command} ${verb} -f ${sourceFile} ${inNamespace}`, this.app).then(
            ReplExpect.okWithCustom({ selector: Selectors.BY_NAME(podName) })
          )

          // wait for the badge to become green
          await waitForGreen(this.app, selector)
        } catch (err) {
          await Common.oops(this, true)(err)
        }
      })
    }

    const editLastApplied = (key: string, value: string, viaFile?: string) => {
      it(`should edit last applied configuration via ${command} apply edit-last-applied ${viaFile && '-f'}`, () =>
        CLI.command(`${command} apply edit-last-applied ${viaFile || `pod ${podName}`} ${inNamespace}`, this.app)
          .then(ReplExpect.justOK)
          .then(SidecarExpect.open)
          .then(SidecarExpect.showing(podName, undefined, undefined, ns))
          .then(SidecarExpect.mode(lastAppliedMode))
          .then(async () => {
            const actualText = await Util.getValueFromMonaco(this.app)
            const labelsLineIdx = actualText.split(/\n/).indexOf('  labels:')

            // +2 here because nth-child is indexed from 1, and we want the line after that
            const lineSelector = `${Selectors.SIDECAR} .view-lines > .view-line:nth-child(${labelsLineIdx +
              2}) .mtk5:last-child`
            await this.app.client.click(lineSelector)

            await new Promise(resolve => setTimeout(resolve, 2000))
            await this.app.client.keys(`${Keys.End}${Keys.ENTER}${key}: ${value}${Keys.ENTER}`)
            await new Promise(resolve => setTimeout(resolve, 2000))
            await this.app.client.click(Selectors.SIDECAR_MODE_BUTTON('Save'))
            await SidecarExpect.toolbarAlert({ type: 'success', text: 'Successfully Applied', exact: false })(this.app)
            await this.app.client.waitForVisible(Selectors.SIDECAR_MODE_BUTTON('Save'), 10000, true)
          })
          .catch(Common.oops(this, true)))
    }

    // check that we can view this last applied configuration via "apply view-last-applied"
    const viewLastApplied = (expectString: string, viaFile?: string) => {
      it(`view last applied configuration via ${command} apply view-last-applied ${viaFile && '-f'}`, () =>
        CLI.command(`${command} apply view-last-applied ${viaFile || `pod ${podName}`} ${inNamespace}`, this.app)
          .then(ReplExpect.justOK)
          .then(SidecarExpect.open)
          .then(SidecarExpect.showing(podName, undefined, undefined, ns))
          .then(SidecarExpect.mode(lastAppliedMode))
          .then(async () => {
            const actualText = await Util.getValueFromMonaco(this.app)
            assert.ok(actualText.indexOf(expectString) !== -1)
          })
          .catch(Common.oops(this, true)))
    }

    /* Here comes the tests */

    doCreate('create')

    // no last applied configuration, yet
    it(`view last applied configuration and expect 404 via ${command}`, () =>
      CLI.command(`${command} apply view-last-applied pod ${podName} ${inNamespace}`, this.app)
        .then(ReplExpect.error(404))
        .catch(Common.oops(this, true)))

    it(`should fail to set last applied configuration via ${command} apply set-last-applied`, () =>
      CLI.command(`${command} apply set-last-applied pod ${podName} ${inNamespace} -f ${sourceFile}`, this.app)
        .then(ReplExpect.error(1))
        .catch(Common.oops(this, true)))

    it(`should succeed to set last applied configuration via ${command} apply set-last-applied --create-annotation`, () =>
      CLI.command(
        `${command} apply set-last-applied pod ${podName} ${inNamespace} -f ${sourceFile} --create-annotation`,
        this.app
      )
        .then(ReplExpect.okWithPtyOutput('configured'))
        .catch(Common.oops(this, true)))

    editLastApplied('foo', 'bar')
    viewLastApplied('foo: bar', `-f ${sourceFile}`)
    editLastApplied('foo1', 'bar1', `-f ${sourceFile}`)
    viewLastApplied('foo1: bar1')

    deleteNS(this, ns, command)
  })
})
