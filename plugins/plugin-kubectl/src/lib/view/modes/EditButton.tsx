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

import React from 'react'
import { Icons } from '@kui-shell/plugin-client-common'
import { ModeRegistration, i18n } from '@kui-shell/core'

import { isEditable as isAlreadyEditable } from '../../../controller/kubectl/edit'
import { KubeResource, isCrudableKubeResource, fqnOf, getCommandFromArgs } from '../../../'

const strings = i18n('plugin-client-common', 'editor')

/** Mode identifier */
const mode = 'edit-button'

/** Mode label; intentionally no i18n */
export const label = strings('Edit')

/** Should we decorate the given resource with an Edit button? */
function isEditable(resource: KubeResource) {
  return isCrudableKubeResource(resource) && !isAlreadyEditable(resource)
}

/**
 * The YAML mode applies to all KubeResources, and simply extracts the
 * raw `data` field from the resource; note how we indicate that this
 * raw data has a yaml content type.
 *
 */
const yamlMode: ModeRegistration<KubeResource> = {
  when: isEditable,
  mode: {
    mode,
    label,
    icon: <Icons icon="Edit" />,

    kind: 'drilldown' as const,
    command: (_, resource: KubeResource, args: { argvNoOptions: string[] }) =>
      `${getCommandFromArgs(args)} edit ${fqnOf(resource)}`
  }
}

export default yamlMode
