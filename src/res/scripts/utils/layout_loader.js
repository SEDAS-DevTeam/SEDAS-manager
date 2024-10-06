export function parse_settings_layout(config){
    const createElement = (tag, attributes = {}, children = []) => {
        const element = document.createElement(tag)
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value))
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child))
            } else {
                element.appendChild(child)
            }
        })
        return element
    }

    const createInput = (name, id, type, unit = '') => {
        const label = createElement('label', { for: name }, [name])
        const input = createElement('input', { type: type === 'checkbox' ? 'checkbox' : 'text', name, id: id, class: 'settings-elem' })
        if (unit) {
            return [label, createElement('br'), input, createElement('label', { for: id }, [`(${unit})`]), createElement('br')]
        }
        return [label, createElement('br'), input, createElement('br')]
    }

    const createSelect = (name, id, options) => {
        const label = createElement('label', { for: id }, [name])
        const select = createElement('select', { id: id, name, class: 'settings-elem' }, options.map(opt => createElement('option', { value: opt.id }, [opt.name])))
        return [label, select, createElement('br')]
    }

    const createCheckbox = (name, id) => {
        const label = createElement('label', { for: id }, [name])
        const checkbox = createElement('input', { type: 'checkbox', name, id: id, class: 'settings-elem' })
        return [label, checkbox, createElement('br')]
    }

    const createH3Header = (text) => {
        const header = createElement("h3", {}, [text])
        return [header]
    }

    const createH2Header = (text) => {
        const header_container = createElement("div", {class: "set-header"}, [createElement("h2", {}, [text]), createElement("hr")])
        return [header_container]
    }

    const parseChildren = (childrenConfig) => {
        let elements = []
        Object.entries(childrenConfig).forEach(([key, childConfig]) => {
            switch(childConfig.type){
                case "h2": {
                    elements.push(...createH2Header(childConfig.name))
                    if (childConfig.children) {
                        elements.push(...parseChildren(childConfig.children))
                    }
                    break
                }
                case "h3": {
                    elements.push(...createH3Header(childConfig.name))
                    if (childConfig.children) {
                        elements.push(...parseChildren(childConfig.children))
                    }
                    break
                }
                case "input": {
                    elements.push(...createInput(childConfig.name, childConfig.id, 'text', childConfig.unit))
                    break
                }
                case "select": {
                    elements.push(...createSelect(childConfig.name, childConfig.id, childConfig.options))
                    break
                }
                case "checkbox": {
                    elements.push(...createCheckbox(childConfig.name, childConfig.id))
                    break
                }
            }
        })
        return elements
    }

    const settingsNode = createElement('div', { style: 'margin-left: 20px' }, parseChildren(config.headers))
    return settingsNode
}